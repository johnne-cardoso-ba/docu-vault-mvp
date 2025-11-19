import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, AlertCircle, Headset, MessageSquare, Eye } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';

type AnalyticsData = {
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
          <h2 className="text-3xl font-bold text-foreground">Dashboard de Atendimento</h2>
          <p className="text-muted-foreground mt-2">Métricas e indicadores do sistema de solicitações</p>
        </div>

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
