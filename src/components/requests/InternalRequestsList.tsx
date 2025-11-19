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

const statusColors: Record<string, string> = {
  aberto: 'bg-blue-500',
  em_atendimento: 'bg-yellow-500',
  concluido: 'bg-green-500',
};

export function InternalRequestsList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [setorFilter, setSetorFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*, clients(nome_razao_social, email)')
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
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{request.clients?.nome_razao_social}</span>
          </div>
          
          <h3 className="font-semibold text-foreground">{request.assunto}</h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.descricao}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
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
