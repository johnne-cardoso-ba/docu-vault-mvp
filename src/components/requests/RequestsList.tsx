import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageSquare, Calendar, Building } from 'lucide-react';
import { RequestChat } from './RequestChat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const setoresLabels: Record<string, string> = {
  fiscal: 'Fiscal',
  pessoal: 'Pessoal',
  contabil: 'Contábil',
  controladoria: 'Controladoria',
  procuradoria: 'Procuradoria',
};

const statusLabels: Record<string, string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em Atendimento',
  concluido: 'Concluído',
};

const statusColors: Record<string, string> = {
  aberto: 'bg-blue-500',
  em_atendimento: 'bg-yellow-500',
  concluido: 'bg-green-500',
};

export function RequestsList({ openRequestId }: { openRequestId?: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [setorFilter, setSetorFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  // Abrir automaticamente o request quando vier da notificação
  useEffect(() => {
    if (openRequestId && requests.length > 0) {
      const request = requests.find(r => r.id === openRequestId);
      if (request) {
        console.log('📖 Abrindo solicitação da notificação:', request);
        setSelectedRequest(request);
      }
    }
  }, [openRequestId, requests]);

  const loadRequests = async () => {
    try {
      // Buscar email do usuário logado via perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.email) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          clients!inner(nome_razao_social, email)
        `)
        .eq('clients.email', profile.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = (status: string) => {
    return requests.filter((req) => {
      const matchesSearch = 
        req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.assunto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSetor = setorFilter === 'all' || req.setor === setorFilter;
      const matchesStatus = req.status === status;
      
      return matchesSearch && matchesSetor && matchesStatus;
    });
  };

  // Aberto = enviadas
  const enviadas = filterByStatus('aberto');
  // Em atendimento = respondidas
  const respondidas = filterByStatus('em_atendimento');
  // Concluído = concluídas
  const concluidas = filterByStatus('concluido');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <RequestChat
        request={selectedRequest}
        onBack={() => {
          setSelectedRequest(null);
          loadRequests();
        }}
      />
    );
  }

  const RequestCard = ({ request }: { request: any }) => (
    <Card
      className="p-4 hover:bg-accent cursor-pointer transition-colors"
      onClick={() => setSelectedRequest(request)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-primary">
              #{request.protocol}
            </span>
            <Badge className={statusColors[request.status]}>
              {statusLabels[request.status]}
            </Badge>
            <Badge variant="outline">
              <Building className="mr-1 h-3 w-3" />
              {setoresLabels[request.setor]}
            </Badge>
          </div>
          
          <h3 className="font-semibold text-foreground">{request.assunto}</h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.descricao}
          </p>
          
          <div className="flex flex-col gap-1">
            {request.atendente?.nome && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Atendente: {request.atendente.nome}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por protocolo ou assunto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={setorFilter} onValueChange={setSetorFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Setores</SelectItem>
            <SelectItem value="fiscal">Fiscal</SelectItem>
            <SelectItem value="pessoal">Pessoal</SelectItem>
            <SelectItem value="contabil">Contábil</SelectItem>
            <SelectItem value="controladoria">Controladoria</SelectItem>
            <SelectItem value="procuradoria">Procuradoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="enviadas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enviadas">
            Enviadas ({enviadas.length})
          </TabsTrigger>
          <TabsTrigger value="respondidas">
            Respondidas ({respondidas.length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({concluidas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enviadas" className="space-y-4">
          {enviadas.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma solicitação enviada</p>
            </Card>
          ) : (
            enviadas.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="respondidas" className="space-y-4">
          {respondidas.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma solicitação em atendimento</p>
            </Card>
          ) : (
            respondidas.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="space-y-4">
          {concluidas.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma solicitação concluída</p>
            </Card>
          ) : (
            concluidas.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
