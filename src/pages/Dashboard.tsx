import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, AlertCircle, Headset, MessageSquare, Eye } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';

type AnalyticsData = {
  totalDocuments: number;
  unreadDocuments: number;
  totalClients: number;
  inactiveClients: number;
  pendingRequests: number;
  totalRequests: number;
  respondedRequests: number;
  completedRequests: number;
  averageResponseTime: string;
  todayRequests: number;
  openRequests: number;
  inProgressRequests: number;
};

export default function Dashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDocuments: 0,
    unreadDocuments: 0,
    totalClients: 0,
    inactiveClients: 0,
    pendingRequests: 0,
    totalRequests: 0,
    respondedRequests: 0,
    completedRequests: 0,
    averageResponseTime: '-',
    todayRequests: 0,
    openRequests: 0,
    inProgressRequests: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'colaborador') {
      fetchAnalytics();
    } else {
      setLoadingAnalytics(false);
    }
  }, [userRole]);

  const fetchAnalytics = async () => {
    try {
      // Fetch total documents
      const { count: totalDocsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Fetch unread documents
      const { count: unreadDocsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .is('data_leitura', null);

      // Fetch total clients
      const { count: totalClientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch inactive clients (haven't accessed in 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: allClients } = await supabase
        .from('clients')
        .select('id, email');

      let inactiveCount = 0;
      if (allClients) {
        for (const client of allClients) {
          const { data: recentDocs } = await supabase
            .from('documents')
            .select('data_leitura')
            .eq('client_id', client.id)
            .gte('data_leitura', thirtyDaysAgo.toISOString())
            .limit(1);

          if (!recentDocs || recentDocs.length === 0) {
            inactiveCount++;
          }
        }
      }

      // Fetch total requests
      const { count: totalRequestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true });

      // Fetch open requests (aberto)
      const { count: openRequestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aberto');

      // Fetch in progress requests (em_atendimento)
      const { count: inProgressRequestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_atendimento');

      // Fetch completed requests (concluido)
      const { count: completedRequestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluido');

      // Fetch pending requests (aberto ou em_atendimento)
      const pendingCount = (openRequestsCount || 0) + (inProgressRequestsCount || 0);

      // Fetch requests with at least one response (have messages)
      const { data: allRequests } = await supabase
        .from('requests')
        .select('id, created_at');

      let respondedCount = 0;
      let totalResponseTime = 0;
      let responsesWithTime = 0;

      if (allRequests) {
        for (const request of allRequests) {
          const { data: messages } = await supabase
            .from('request_messages')
            .select('created_at')
            .eq('request_id', request.id)
            .order('created_at', { ascending: true });

          if (messages && messages.length > 1) {
            respondedCount++;
            
            // Calculate time to first response (difference between first and second message)
            const firstMessageTime = new Date(messages[0].created_at).getTime();
            const secondMessageTime = new Date(messages[1].created_at).getTime();
            const responseTime = (secondMessageTime - firstMessageTime) / (1000 * 60 * 60); // in hours
            
            totalResponseTime += responseTime;
            responsesWithTime++;
          }
        }
      }

      // Calculate average response time
      const avgResponseTime = responsesWithTime > 0 
        ? (totalResponseTime / responsesWithTime).toFixed(1) 
        : '-';

      // Fetch today's requests
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayRequestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setAnalytics({
        totalDocuments: totalDocsCount || 0,
        unreadDocuments: unreadDocsCount || 0,
        totalClients: totalClientsCount || 0,
        inactiveClients: inactiveCount,
        pendingRequests: pendingCount,
        totalRequests: totalRequestsCount || 0,
        respondedRequests: respondedCount,
        completedRequests: completedRequestsCount || 0,
        averageResponseTime: avgResponseTime !== '-' ? `${avgResponseTime}h` : '-',
        todayRequests: todayRequestsCount || 0,
        openRequests: openRequestsCount || 0,
        inProgressRequests: inProgressRequestsCount || 0,
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
          <p className="text-muted-foreground mt-2">Visão geral do sistema</p>
        </div>

        {/* Analytics Cards */}
        {(userRole === 'admin' || userRole === 'colaborador') && (
          <>
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
                        Total de Documentos
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalDocuments}</div>
                      <p className="text-xs text-muted-foreground">
                        Documentos no sistema
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Documentos Não Visualizados
                      </CardTitle>
                      <Eye className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{analytics.unreadDocuments}</div>
                      <p className="text-xs text-muted-foreground">
                        Aguardando visualização
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Clientes
                      </CardTitle>
                      <Headset className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalClients}</div>
                      <p className="text-xs text-muted-foreground">
                        Clientes cadastrados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Clientes Inativos
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{analytics.inactiveClients}</div>
                      <p className="text-xs text-muted-foreground">
                        Sem acesso há +30 dias
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Atendimento Metrics Section */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Métricas de Atendimento</h3>
            </div>
          </>
        )}

        {/* Atendimento Metrics */}
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
                      Atendimentos Pendentes
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{analytics.pendingRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando atendimento ou resposta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Solicitações
                    </CardTitle>
                    <Headset className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Todas as solicitações registradas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Atendimentos Respondidos
                    </CardTitle>
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{analytics.respondedRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Com pelo menos uma resposta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Atendimentos Concluídos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{analytics.completedRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Atendimentos finalizados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tempo Médio de Resposta
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{analytics.averageResponseTime}</div>
                    <p className="text-xs text-muted-foreground">
                      Média entre solicitação e resposta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Solicitações Hoje
                    </CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.todayRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Abertas nas últimas 24 horas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Status: Aberto
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{analytics.openRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando início do atendimento
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Status: Em Atendimento
                    </CardTitle>
                    <Headset className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{analytics.inProgressRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Em processo de atendimento
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Cliente View */}
        {userRole === 'cliente' && (
          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo ao Portal do Cliente</CardTitle>
              <CardDescription>Acesse seus documentos e solicitações através do menu lateral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/documentos')}
                >
                  <FileText className="h-8 w-8" />
                  <span>Ver Documentos</span>
                </Button>
                <Button 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/solicitacoes')}
                >
                  <MessageSquare className="h-8 w-8" />
                  <span>Minhas Solicitações</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
