import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, AlertCircle, Headset, MessageSquare, Eye, Star, Trophy, UserX } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatusCards } from '@/components/dashboard/StatusCards';
import { FiscalCalendar } from '@/components/dashboard/FiscalCalendar';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

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

type TopColaborador = {
  id: string;
  nome: string;
  email: string;
  averageRating: number;
  totalRatings: number;
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
  const [topColaboradores, setTopColaboradores] = useState<TopColaborador[]>([]);
  const [myRatings, setMyRatings] = useState<{
    averageRating: number;
    totalRatings: number;
    rating5: number;
    rating4: number;
    rating3: number;
    rating2: number;
    rating1: number;
  } | null>(null);

  // Client Dashboard States
  const [clientData, setClientData] = useState<{
    name: string;
    email: string;
    documentsReceived: number;
    unreadDocuments: number;
    dueSoonCount: number;
    totalToPay: number;
    obligationsDelivered: number;
    totalObligations: number;
    upcomingDueDates: any[];
    recentActivities: any[];
  } | null>(null);
  const [loadingClientData, setLoadingClientData] = useState(true);

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'colaborador') {
      fetchAnalytics();
      fetchTopColaboradores();
      if (userRole === 'colaborador') {
        fetchMyRatings();
      }
    } else if (userRole === 'cliente') {
      fetchClientDashboardData();
    } else {
      setLoadingAnalytics(false);
    }
  }, [userRole]);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se é colaborador para filtrar métricas
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isColaborador = roleData?.role === 'colaborador';

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

      // Fetch total requests (filtrado por colaborador se necessário)
      let requestsQuery = supabase
        .from('requests')
        .select('*', { count: 'exact', head: true });
      
      if (isColaborador) {
        requestsQuery = requestsQuery.or(`atendente_id.eq.${user.id},atendente_id.is.null`);
      }
      
      const { count: totalRequestsCount } = await requestsQuery;

      // Fetch open requests (aberto)
      let openQuery = supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aberto');
      
      if (isColaborador) {
        openQuery = openQuery.or(`atendente_id.eq.${user.id},atendente_id.is.null`);
      }
      
      const { count: openRequestsCount } = await openQuery;

      // Fetch in progress requests (em_atendimento)
      let inProgressQuery = supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_atendimento');
      
      if (isColaborador) {
        inProgressQuery = inProgressQuery.or(`atendente_id.eq.${user.id},atendente_id.is.null`);
      }
      
      const { count: inProgressRequestsCount } = await inProgressQuery;

      // Fetch completed requests (concluido)
      let completedQuery = supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluido');
      
      if (isColaborador) {
        completedQuery = completedQuery.eq('atendente_id', user.id);
      }
      
      const { count: completedRequestsCount } = await completedQuery;

      // Fetch pending requests (aberto ou em_atendimento)
      const pendingCount = (openRequestsCount || 0) + (inProgressRequestsCount || 0);

      // Fetch requests with at least one response (have messages)
      let allRequestsQuery = supabase
        .from('requests')
        .select('id, created_at');
      
      if (isColaborador) {
        allRequestsQuery = allRequestsQuery.or(`atendente_id.eq.${user.id},atendente_id.is.null`);
      }
      
      const { data: allRequests } = await allRequestsQuery;

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
      let todayQuery = supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      
      if (isColaborador) {
        todayQuery = todayQuery.or(`atendente_id.eq.${user.id},atendente_id.is.null`);
      }
      
      const { count: todayRequestsCount } = await todayQuery;

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

  const fetchMyRatings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ratings, error } = await supabase
        .from('request_ratings')
        .select('rating')
        .eq('atendente_id', user.id);

      if (error) throw error;

      if (ratings && ratings.length > 0) {
        const totalRatings = ratings.length;
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
        
        setMyRatings({
          averageRating,
          totalRatings,
          rating5: ratings.filter(r => r.rating === 5).length,
          rating4: ratings.filter(r => r.rating === 4).length,
          rating3: ratings.filter(r => r.rating === 3).length,
          rating2: ratings.filter(r => r.rating === 2).length,
          rating1: ratings.filter(r => r.rating === 1).length,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar minhas avaliações:', error);
    }
  };

  const fetchClientDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('id', user.id)
        .single();

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('email', profile?.email || '')
        .maybeSingle();

      if (!client) {
        setLoadingClientData(false);
        return;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: docsReceived } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: unreadDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .is('data_leitura', null);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: upcomingDocs, count: dueSoon } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', client.id)
        .not('vencimento', 'is', null)
        .lte('vencimento', sevenDaysFromNow.toISOString().split('T')[0]);

      const totalValue = upcomingDocs?.reduce((sum, doc) => sum + (doc.valor_guia || 0), 0) || 0;

      setClientData({
        name: profile?.nome || 'Cliente',
        email: profile?.email || '',
        documentsReceived: docsReceived || 0,
        unreadDocuments: unreadDocs || 0,
        dueSoonCount: dueSoon || 0,
        totalToPay: totalValue,
        obligationsDelivered: 8,
        totalObligations: 12,
        upcomingDueDates: (upcomingDocs || []).map(doc => ({
          id: doc.id,
          title: doc.filename,
          dueDate: doc.vencimento,
          amount: doc.valor_guia,
          type: 'GUIA',
        })),
        recentActivities: [],
      });
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      setLoadingClientData(false);
    }
  };

  const fetchTopColaboradores = async () => {
    try {
      const { data: ratings, error } = await supabase
        .from('request_ratings')
        .select('atendente_id, rating');

      if (error) throw error;
      if (!ratings || ratings.length === 0) return;

      const ratingsByAtendente = ratings.reduce((acc: any, rating) => {
        if (!acc[rating.atendente_id]) {
          acc[rating.atendente_id] = { total: 0, count: 0 };
        }
        acc[rating.atendente_id].total += rating.rating;
        acc[rating.atendente_id].count += 1;
        return acc;
      }, {});

      const colaboradoresData = await Promise.all(
        Object.entries(ratingsByAtendente).map(async ([atendenteId, data]: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, nome, email')
            .eq('id', atendenteId)
            .single();

          if (!profile) return null;

          return {
            ...profile,
            averageRating: data.total / data.count,
            totalRatings: data.count,
          };
        })
      );

      const topColabs = colaboradoresData
        .filter((c): c is TopColaborador => c !== null)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      setTopColaboradores(topColabs);
    } catch (error) {
      console.error('Erro ao buscar top colaboradores:', error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* CLIENT DASHBOARD */}
        {userRole === 'cliente' && (
          <>
            {loadingClientData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : clientData ? (
              <>
                <WelcomeCard
                  userName={clientData.name}
                  userEmail={clientData.email}
                  accountStatus={clientData.unreadDocuments > 0 ? 'pending' : 'ok'}
                />
                
                <StatusCards
                  documentsReceived={clientData.documentsReceived}
                  unreadDocuments={clientData.unreadDocuments}
                  dueSoonCount={clientData.dueSoonCount}
                  totalToPay={clientData.totalToPay}
                  obligationsDelivered={clientData.obligationsDelivered}
                  totalObligations={clientData.totalObligations}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <FiscalCalendar upcomingDueDates={clientData.upcomingDueDates} />
                  <QuickActions />
                </div>

                <ActivityTimeline activities={clientData.recentActivities} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Não foi possível carregar os dados</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ADMIN/COLABORADOR DASHBOARD */}
        {(userRole === 'admin' || userRole === 'colaborador') && (
          <>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground mt-2">Visão geral do sistema</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {loadingAnalytics ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Documentos
                      </CardTitle>
                      <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{analytics.totalDocuments}</div>
                      <p className="text-xs text-muted-foreground">
                        Documentos no sistema
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-yellow-500">
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

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Clientes
                      </CardTitle>
                      <Headset className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{analytics.totalClients}</div>
                      <p className="text-xs text-muted-foreground">
                        Clientes cadastrados
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
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

          {/* Top Colaboradores Section */}
          {topColaboradores.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Colaboradores Mais Bem Avaliados
              </h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {topColaboradores.map((colab, index) => (
                      <div key={colab.id} className="flex items-center gap-4 p-3 rounded-lg bg-accent/50">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {colab.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{colab.nome}</p>
                          <p className="text-sm text-muted-foreground">{colab.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                            <span className="font-bold text-lg">{colab.averageRating.toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{colab.totalRatings} avaliações</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                <Card className="border-l-4 border-l-yellow-500">
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

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Solicitações
                    </CardTitle>
                    <Headset className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{analytics.totalRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Todas as solicitações registradas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
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

                <Card className="border-l-4 border-l-green-500">
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

                <Card className="border-l-4 border-l-indigo-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tempo Médio de Resposta
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-indigo-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">{analytics.averageResponseTime}</div>
                    <p className="text-xs text-muted-foreground">
                      Média entre solicitação e resposta
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-cyan-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Solicitações Hoje
                    </CardTitle>
                    <Eye className="h-4 w-4 text-cyan-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-600">{analytics.todayRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Abertas nas últimas 24 horas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-sky-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Status: Aberto
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-sky-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-sky-600">{analytics.openRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando início do atendimento
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Status: Em Atendimento
                    </CardTitle>
                    <Headset className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{analytics.inProgressRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Em processo de atendimento
                    </p>
                  </CardContent>
                </Card>

                {/* Card de Avaliação do Colaborador */}
                <Card className="md:col-span-2 border-l-4 border-l-yellow-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Minha Avaliação</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    {!myRatings ? (
                      <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-3xl font-bold text-yellow-600">{myRatings.averageRating.toFixed(1)}</div>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= Math.round(myRatings.averageRating)
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-muted'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Baseado em {myRatings.totalRatings} avaliações
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = myRatings[`rating${rating}` as keyof typeof myRatings] as number;
                            const percentage = (count / myRatings.totalRatings) * 100;
                            return (
                              <div key={rating} className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                  <span className="text-muted-foreground">{rating}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-muted-foreground">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
