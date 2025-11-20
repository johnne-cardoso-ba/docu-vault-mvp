import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Paperclip, Loader2, Download, Building, Calendar, User, ArrowRightLeft, Star, Trash2, CheckCheck, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransferRequestDialog } from './TransferRequestDialog';
import { RatingDialog } from './RatingDialog';
import { DeleteRequestDialog } from './DeleteRequestDialog';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

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

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  aberto: 'default',
  em_atendimento: 'secondary',
  concluido: 'outline',
};

export function RequestChat({ request, onBack, isInternal = false }: RequestChatProps) {
  const { toast } = useToast();
  const { userRole, user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [currentSetor, setCurrentSetor] = useState(request.setor);
  const [atendente, setAtendente] = useState<any>(null);
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasRating, setHasRating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadAtendente();
    loadClientUserId();
    checkRating();
    scrollToBottom();
    markMessagesAsRead();

    const channel = supabase
      .channel(`request_messages_${request.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_messages', filter: `request_id=eq.${request.id}` }, 
        async (payload) => {
          const { data: profile } = await supabase.from('profiles').select('id, nome, avatar_url').eq('id', (payload.new as any).user_id).single();
          const newMessage: any = { ...payload.new, profiles: profile || null };
          setMessages((current) => current.some(msg => msg.id === newMessage.id) ? current : [...current, newMessage]);
          if ((payload.new as any).user_id !== user?.id) markMessageAsRead((payload.new as any).id);
          scrollToBottom();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'request_messages', filter: `request_id=eq.${request.id}` },
        (payload) => setMessages((current) => current.map((msg) => msg.id === (payload.new as any).id ? { ...msg, ...(payload.new as any) } : msg))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'request_messages', filter: `request_id=eq.${request.id}` },
        (payload) => setMessages((current) => current.filter((msg) => msg.id !== (payload.old as any).id))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [request.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadMessages = async () => {
    try {
      const { data } = await supabase.from('request_messages').select('*, profiles:user_id (id, nome, avatar_url)').eq('request_id', request.id).order('created_at', { ascending: true });
      setMessages(data || []);
    } finally { setLoading(false); }
  };

  const loadAtendente = async () => {
    if (!request.atendente_id) return;
    const { data } = await supabase.from('profiles').select('id, nome, avatar_url, email').eq('id', request.atendente_id).single();
    setAtendente(data);
  };

  const loadClientUserId = async () => {
    const { data: client } = await supabase.from('clients').select('email').eq('id', request.client_id).single();
    if (!client) return;
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', client.email).single();
    setClientUserId(profile?.id || null);
  };

  const checkRating = async () => {
    const { data } = await supabase.from('request_ratings').select('id').eq('request_id', request.id).maybeSingle();
    setHasRating(!!data);
  };

  const markMessagesAsRead = async () => {
    if (!user) return;
    await supabase.from('request_messages').update({ lida: true, lida_em: new Date().toISOString() }).eq('request_id', request.id).neq('user_id', user.id).eq('lida', false);
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase.from('request_messages').update({ lida: true, lida_em: new Date().toISOString() }).eq('id', messageId);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await supabase.from('request_messages').delete().eq('id', messageId);
      toast({ title: 'Mensagem excluída', description: 'A mensagem foi removida com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !file || !user) return;
    setSending(true);

    try {
      if (file) {
        const fileName = `${user.id}/${request.id}/${Date.now()}-${file.name}`;
        await supabase.storage.from('request-files').upload(fileName, file);
        const { data: { publicUrl } } = supabase.storage.from('request-files').getPublicUrl(fileName);
        await supabase.from('request_messages').insert({ request_id: request.id, user_id: user.id, tipo_mensagem: 'arquivo', file_url: publicUrl, filename: file.name });
        setFile(null);
      }

      if (newMessage.trim()) {
        await supabase.from('request_messages').insert({ request_id: request.id, user_id: user.id, tipo_mensagem: 'texto', conteudo: newMessage });
      }

      setNewMessage('');
      scrollToBottom();
    } catch (error: any) {
      toast({ title: 'Erro ao enviar mensagem', description: error.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const handleUpdateStatus = async (newStatus: 'aberto' | 'em_atendimento' | 'concluido') => {
    try {
      await supabase.from('requests').update({ status: newStatus }).eq('id', request.id);
      setCurrentStatus(newStatus);
      await supabase.from('request_history').insert({ request_id: request.id, changed_by: user?.id || '', tipo_mudanca: 'status', valor_anterior: currentStatus, valor_novo: newStatus });
      toast({ title: 'Status atualizado', description: `Status alterado para ${statusLabels[newStatus]}` });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateSetor = async (newSetor: 'fiscal' | 'pessoal' | 'contabil' | 'controladoria' | 'procuradoria') => {
    try {
      await supabase.from('requests').update({ setor: newSetor }).eq('id', request.id);
      setCurrentSetor(newSetor);
      await supabase.from('request_history').insert({ request_id: request.id, changed_by: user?.id || '', tipo_mudanca: 'setor', valor_anterior: currentSetor, valor_novo: newSetor });
      toast({ title: 'Setor atualizado', description: `Setor alterado para ${setoresLabels[newSetor]}` });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar setor', description: error.message, variant: 'destructive' });
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
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Área Principal do Chat */}
      <div className="flex-1 flex flex-col bg-background rounded-lg border shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={atendente?.avatar_url} />
                <AvatarFallback className="bg-primary/10">{request.clients?.nome_razao_social?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg leading-none">{request.assunto}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="font-mono">#{request.protocol}</span>
                  <span>•</span>
                  <span>{isInternal ? request.clients?.nome_razao_social : 'Suporte'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[currentStatus]} className="font-medium">
              {statusLabels[currentStatus]}
            </Badge>
            {isInternal && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowTransferDialog(true)}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transferir
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-muted/20">
          {messages.map((message) => {
            const isOwnMessage = message.user_id === user?.id;
            
            return (
              <div key={message.id} className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {!isOwnMessage && (
                  <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-background">
                    <AvatarImage src={message.profiles?.avatar_url} />
                    <AvatarFallback className="bg-secondary/50 text-xs">
                      {message.profiles?.nome?.substring(0, 2).toUpperCase() || 'SI'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col gap-1.5 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {!isOwnMessage && (
                    <span className="text-xs font-semibold text-foreground px-3">
                      {message.profiles?.nome || 'Sistema'}
                    </span>
                  )}
                  
                  {message.tipo_mensagem === 'texto' && (
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card text-foreground border rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.conteudo}</p>
                    </div>
                  )}
                  
                  {message.tipo_mensagem === 'arquivo' && (
                    <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card text-foreground border rounded-bl-md'
                      }`}
                    >
                      <FileText className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{message.filename}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.open(message.file_url, '_blank')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                    </span>
                    {isOwnMessage && message.lida && (
                      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    {isInternal && userRole === 'admin' && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteMessage(message.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {isOwnMessage && (
                  <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-primary/20">
                    <AvatarImage src={message.profiles?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-xs">
                      {message.profiles?.nome?.substring(0, 2).toUpperCase() || 'EU'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensagem */}
        <div className="px-6 py-4 border-t bg-card/50 backdrop-blur">
          {file && (
            <div className="mb-3 flex items-center gap-2 bg-muted/50 px-3 py-2.5 rounded-lg border">
              <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm flex-1 truncate font-medium">{file.name}</span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input type="file" id="file-upload" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
            <Button type="button" variant="ghost" size="icon" className="flex-shrink-0" onClick={() => document.getElementById('file-upload')?.click()}>
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 h-11"
              disabled={sending}
            />
            
            <Button type="submit" size="icon" disabled={sending || (!newMessage.trim() && !file)} className="rounded-full h-11 w-11 flex-shrink-0">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Painel Lateral de Informações */}
      <Card className="w-80 flex flex-col h-full shadow-sm">
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h3 className="font-semibold text-lg mb-4">Informações Gerais</h3>
            <div className="space-y-4">
              {isInternal && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-primary" />
                    <span>Cliente</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
                    {request.clients?.nome_razao_social}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building className="h-4 w-4 text-primary" />
                  <span>Setor</span>
                </div>
                {isInternal ? (
                  <Select value={currentSetor} onValueChange={handleUpdateSetor}>
                    <SelectTrigger className="ml-6">
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
                ) : (
                  <p className="text-sm text-muted-foreground pl-6">{setoresLabels[currentSetor]}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Data de Criação</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {atendente && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-primary" />
                    <span>Atendente</span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <Avatar className="h-6 w-6 ring-2 ring-background">
                      <AvatarImage src={atendente.avatar_url} />
                      <AvatarFallback className="text-xs">{atendente.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground font-medium">{atendente.nome}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isInternal && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-4">Status</h3>
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
            </>
          )}

          {!isInternal && currentStatus === 'concluido' && !hasRating && (
            <>
              <Separator />
              <Button onClick={() => setShowRatingDialog(true)} className="w-full">
                <Star className="mr-2 h-4 w-4" />
                Avaliar Atendimento
              </Button>
            </>
          )}

          <Separator />
          <div>
            <h3 className="font-semibold text-lg mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {request.descricao}
            </p>
          </div>
        </div>
      </Card>

      {showTransferDialog && (
        <TransferRequestDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          request={request}
          onTransferComplete={() => {
            setShowTransferDialog(false);
            onBack();
          }}
        />
      )}

      {showRatingDialog && clientUserId && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          request={request}
          onRatingComplete={() => {
            setShowRatingDialog(false);
            checkRating();
          }}
        />
      )}

      {showDeleteDialog && (
        <DeleteRequestDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          request={request}
          onDeleteComplete={() => {
            setShowDeleteDialog(false);
            onBack();
          }}
        />
      )}
    </div>
  );
}
