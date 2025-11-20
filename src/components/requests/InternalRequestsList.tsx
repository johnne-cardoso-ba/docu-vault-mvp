import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageSquare, Calendar, Building, User } from 'lucide-react';
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

const statusVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  aberto: 'default',
  em_atendimento: 'secondary',
  concluido: 'outline',
};

export function InternalRequestsList({ openRequestId }: { openRequestId?: string }) {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar perfil do colaborador para verificar seu setor
      const { data: profile } = await supabase
        .from('profiles')
        .select('setor')
        .eq('id', user.id)
        .single();

      // Buscar role do usuário
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      let query = supabase
        .from('requests')
        .select('*, clients(nome_razao_social, email)');

      // Se for admin, vê todas as solicitações
      if (roleData?.role === 'admin') {
        query = query.or(`atendente_id.eq.${user.id},atendente_id.is.null`);
      } else if (roleData?.role === 'colaborador') {
        // Se tem setor específico, filtra por esse setor
        if (profile?.setor) {
          query = query
            .eq('setor', profile.setor)
            .or(`atendente_id.eq.${user.id},atendente_id.is.null`);
        } else {
          // Se não tem setor (geral), vê todas
          query = query.or(`atendente_id.eq.${user.id},atendente_id.is.null`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
        req.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.clients?.nome_razao_social?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSetor = setorFilter === 'all' || req.setor === setorFilter;
      const matchesStatus = req.status === status;
      
      return matchesSearch && matchesSetor && matchesStatus;
    });
  };

  const abertas = filterByStatus('aberto');
  const emAtendimento = filterByStatus('em_atendimento');
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
        isInternal
      />
    );
  }

  const RequestCard = ({ request }: { request: any }) => (
    <Card
      className="p-6 hover:shadow-md cursor-pointer transition-all border-l-4 border-l-primary/20 hover:border-l-primary"
      onClick={() => setSelectedRequest(request)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-lg font-bold text-foreground">
              #{request.protocol}
            </span>
            <Badge variant={statusVariants[request.status]} className="font-medium">
              {statusLabels[request.status]}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Building className="h-3 w-3" />
              {setoresLabels[request.setor]}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="h-4 w-4 text-primary" />
          <span>{request.clients?.nome_razao_social}</span>
        </div>
        
        <h3 className="text-lg font-semibold text-foreground leading-tight">{request.assunto}</h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {request.descricao}
        </p>
        
        <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por protocolo, assunto ou cliente..."
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

      <Tabs defaultValue="aberto" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="aberto">
            Abertas ({abertas.length})
          </TabsTrigger>
          <TabsTrigger value="em_atendimento">
            Em Atendimento ({emAtendimento.length})
          </TabsTrigger>
          <TabsTrigger value="concluido">
            Concluídas ({concluidas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aberto" className="space-y-4">
          {abertas.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma solicitação aberta</p>
            </Card>
          ) : (
            abertas.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="em_atendimento" className="space-y-4">
          {emAtendimento.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma solicitação em atendimento</p>
            </Card>
          ) : (
            emAtendimento.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </TabsContent>

        <TabsContent value="concluido" className="space-y-4">
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
