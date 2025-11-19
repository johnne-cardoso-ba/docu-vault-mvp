import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Paperclip, Loader2, Download, Building, Calendar, User, ArrowRightLeft, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransferRequestDialog } from './TransferRequestDialog';
import { RatingDialog } from './RatingDialog';
import { useAuth } from '@/hooks/useAuth';

interface RequestChatProps {
  request: any;
  onBack: () => void;
  isInternal?: boolean;
}

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

export function RequestChat({ request, onBack, isInternal = false }: RequestChatProps) {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [currentSetor, setCurrentSetor] = useState(request.setor);
  const [atendente, setAtendente] = useState<any>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [hasRating, setHasRating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadAtendente();
    checkRating();
    scrollToBottom();

    // Setup realtime subscription
    const channel = supabase
      .channel(`request_messages_${request.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_messages',
          filter: `request_id=eq.${request.id}`,
        },
        async (payload) => {
          // Buscar perfil do usuário que enviou a mensagem
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, nome')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            profiles: profile || null
          };

          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('request_messages')
        .select('*')
        .eq('request_id', request.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar perfis dos usuários das mensagens
      if (messagesData && messagesData.length > 0) {
        const userIds = [...new Set(messagesData.map(m => m.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const messagesWithProfiles = messagesData.map(msg => ({
          ...msg,
          profiles: profilesMap.get(msg.user_id) || null
        }));
        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAtendente = async () => {
    if (!request.atendente_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .eq('id', request.atendente_id)
        .single();

      if (error) throw error;
      setAtendente(data);
    } catch (error) {
      console.error('Erro ao carregar atendente:', error);
    }
  };

  const checkRating = async () => {
    try {
      const { data, error } = await supabase
        .from('request_ratings')
        .select('id')
        .eq('request_id', request.id)
        .maybeSingle();

      if (data) {
        setHasRating(true);
      }
    } catch (error) {
      // Não há avaliação ainda
      setHasRating(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const { error } = await supabase
        .from('request_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(messages.filter(m => m.id !== messageId));
      
      toast({
        title: 'Mensagem excluída',
        description: 'A mensagem foi removida com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir mensagem',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !file) return;

    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Enviar arquivo se houver
      if (file) {
        const fileName = `${user.id}/${request.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('request-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('request-files')
          .getPublicUrl(fileName);

        await supabase.from('request_messages').insert({
          request_id: request.id,
          user_id: user.id,
          tipo_mensagem: 'arquivo',
          file_url: publicUrl,
          filename: file.name,
        });
      }

      // Enviar mensagem de texto se houver
      if (newMessage.trim()) {
        const { error: messageError } = await supabase
          .from('request_messages')
          .insert({
            request_id: request.id,
            user_id: user.id,
            tipo_mensagem: 'texto',
            conteudo: newMessage,
          });

        if (messageError) throw messageError;
      }

      setNewMessage('');
      setFile(null);
      loadMessages();
      
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus as any })
        .eq('id', request.id);

      if (error) throw error;

      await supabase.from('request_history').insert({
        request_id: request.id,
        changed_by: user.id,
        tipo_mudanca: 'status',
        valor_anterior: currentStatus,
        valor_novo: newStatus,
        descricao: `Status alterado de ${statusLabels[currentStatus]} para ${statusLabels[newStatus]}`,
      });

      setCurrentStatus(newStatus);
      
      toast({
        title: 'Status atualizado',
        description: `Status alterado para ${statusLabels[newStatus]}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSetor = async (newSetor: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('requests')
        .update({ setor: newSetor as any })
        .eq('id', request.id);

      if (error) throw error;

      await supabase.from('request_history').insert({
        request_id: request.id,
        changed_by: user.id,
        tipo_mudanca: 'setor',
        valor_anterior: currentSetor,
        valor_novo: newSetor,
        descricao: `Setor alterado de ${setoresLabels[currentSetor]} para ${setoresLabels[newSetor]}`,
      });

      setCurrentSetor(newSetor);
      
      toast({
        title: 'Setor atualizado',
        description: `Setor transferido para ${setoresLabels[newSetor]}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar setor',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-semibold text-primary text-xl">
                  #{request.protocol}
                </span>
                <Badge className={statusColors[currentStatus]}>
                  {statusLabels[currentStatus]}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{request.assunto}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Setor:</span>
              <Badge variant="outline">{setoresLabels[currentSetor]}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Criado em:</span>
              <span className="text-muted-foreground">
                {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {isInternal && request.clients && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Cliente:</span>
                <span className="text-muted-foreground">{request.clients.nome_razao_social}</span>
              </div>
            )}
            {!isInternal && atendente && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Atendente:</span>
                <span className="text-muted-foreground">{atendente.nome}</span>
              </div>
            )}
          </div>

          {!isInternal && currentStatus === 'concluido' && !hasRating && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRatingDialog(true)}
              >
                <Star className="mr-2 h-4 w-4" />
                Avaliar Atendimento
              </Button>
            </div>
          )}

          {isInternal && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferDialog(true)}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transferir Atendimento
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Alterar Status</label>
                  <Select value={currentStatus} onValueChange={handleUpdateStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Transferir Setor</label>
                  <Select value={currentSetor} onValueChange={handleUpdateSetor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="pessoal">Pessoal</SelectItem>
                      <SelectItem value="contabil">Contábil</SelectItem>
                      <SelectItem value="controladoria">Controladoria</SelectItem>
                      <SelectItem value="procuradoria">Procuradoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {!isInternal && currentStatus === 'concluido' && !hasRating && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => setShowRatingDialog(true)}
                className="w-full"
              >
                <Star className="mr-2 h-4 w-4" />
                Avaliar Atendimento
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Histórico de Conversas</h3>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{message.profiles?.nome || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {message.tipo_mensagem === 'texto' && (
                    <p className="text-sm bg-muted p-3 rounded-lg">{message.conteudo}</p>
                  )}
                  
                  {message.tipo_mensagem === 'arquivo' && (
                    <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm flex-1">{message.filename}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(message.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {userRole === 'admin' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="space-y-3 pt-4 border-t">
            {file && (
              <div className="flex items-center gap-2 bg-muted p-2 rounded">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm flex-1">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFile(null)}
                >
                  Remover
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                type="file"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" size="icon" asChild>
                  <span className="cursor-pointer">
                    <Paperclip className="h-4 w-4" />
                  </span>
                </Button>
              </label>
              
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={sending || (!newMessage.trim() && !file)}
                size="icon"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <TransferRequestDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        request={request}
        onTransferComplete={() => {
          loadMessages();
          loadAtendente();
          onBack();
        }}
      />

      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        request={request}
        onRatingComplete={() => {
          checkRating();
        }}
      />
    </div>
  );
}
