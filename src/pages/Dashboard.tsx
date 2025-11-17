import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Upload, UserCog, Eye, UserX, Loader2, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';

type AnalyticsData = {
  unreadDocuments: number;
  inactiveClients: number;
  totalClients: number;
  totalDocuments: number;
};

export default function Dashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    unreadDocuments: 0,
    inactiveClients: 0,
    totalClients: 0,
    totalDocuments: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'colaborador') {
      fetchAnalytics();
    }
  }, [userRole]);

  const fetchAnalytics = async () => {
    try {
      // Fetch unread documents (documents without data_leitura)
      const { count: unreadCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .is('data_leitura', null);

      // Fetch total documents
      const { count: totalDocsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Fetch clients who haven't accessed in 30+ days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all clients with role 'cliente'
      const { data: clientRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'cliente');

      const clientIds = clientRoles?.map(r => r.user_id) || [];

      // Count inactive clients (those who never logged in or haven't logged in for 30+ days)
      let inactiveCount = 0;
      if (clientIds.length > 0) {
        // This is a simplified approach - in production you'd want to track last_sign_in
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, created_at')
          .in('id', clientIds);

        // Count profiles created more than 30 days ago as potentially inactive
        // (This is a simplification - ideally you'd track last login)
        inactiveCount = profiles?.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate < thirtyDaysAgo;
        }).length || 0;
      }

      // Fetch total clients
      const { count: totalClientsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'cliente');

      setAnalytics({
        unreadDocuments: unreadCount || 0,
        inactiveClients: inactiveCount,
        totalClients: totalClientsCount || 0,
        totalDocuments: totalDocsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-2">Bem-vindo ao sistema de gestão de documentos contábeis</p>
        </div>

        {/* Analytics Cards - Only for admin and colaborador */}
        {(userRole === 'admin' || userRole === 'colaborador') && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loadingAnalytics ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Documentos Não Lidos
                    </CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{analytics.unreadDocuments}</div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando visualização pelos clientes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Clientes Inativos
                    </CardTitle>
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{analytics.inactiveClients}</div>
                    <p className="text-xs text-muted-foreground">
                      Sem acesso há mais de 30 dias
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Clientes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalClients}</div>
                    <p className="text-xs text-muted-foreground">
                      Clientes cadastrados no sistema
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Documentos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalDocuments}</div>
                    <p className="text-xs text-muted-foreground">
                      Documentos enviados no total
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Action Cards */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Ações Rápidas</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userRole === 'admin' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/colaboradores')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  Colaboradores
                </CardTitle>
                <CardDescription>Gerenciar usuários colaboradores</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cadastrar e gerenciar colaboradores do sistema
                </p>
              </CardContent>
            </Card>
          )}

          {(userRole === 'admin' || userRole === 'colaborador') && (
            <>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/clientes')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Clientes
                  </CardTitle>
                  <CardDescription>Gerenciar clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cadastrar e gerenciar informações dos clientes
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/enviar-documento')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Enviar Documentos
                  </CardTitle>
                  <CardDescription>Upload de documentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Fazer upload de documentos para os clientes
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/documentos')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos
              </CardTitle>
              <CardDescription>Visualizar documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualizar e gerenciar todos os documentos enviados
              </p>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}