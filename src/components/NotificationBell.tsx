import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { usePresence } from '@/hooks/usePresence';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  request_id: string;
  protocol: string;
  assunto: string;
  tipo: 'nova_mensagem' | 'status_alterado' | 'usuario_online';
  created_at: string;
  lida: boolean;
  user_nome?: string;
  user_avatar?: string;
  user_id?: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Rastrear se já notificou na sessão atual
  const [notifiedUsers] = useState(() => new Set<string>());
  
  // Configurar presença e detectar usuários online (apenas para admins e colaboradores)
  const handleUserOnline = useCallback((onlineUser: any) => {
    if (userRole === 'cliente') return;
    
    // Verificar se já notificou esse usuário nesta sessão
    if (notifiedUsers.has(onlineUser.user_id)) {
      return;
    }
    
    // Verificar se é colaborador/admin antes de notificar
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', onlineUser.user_id)
      .single()
      .then(({ data }) => {
        // Só notificar se for colaborador ou admin (não notificar clientes)
        if (data && (data.role === 'colaborador' || data.role === 'admin')) {
          // Adicionar ao set de usuários notificados
          notifiedUsers.add(onlineUser.user_id);
          
          const presenceNotification: Notification = {
            id: `presence-${onlineUser.user_id}-${Date.now()}`,
            request_id: '',
            protocol: '',
            assunto: `${onlineUser.nome} está online`,
            tipo: 'usuario_online',
            created_at: new Date().toISOString(),
            lida: false,
            user_nome: onlineUser.nome,
            user_avatar: onlineUser.avatar_url,
            user_id: onlineUser.user_id,
          };
          
          setNotifications(prev => [presenceNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
          
          toast({
            title: '👤 Colaborador online',
            description: `${onlineUser.nome} acabou de ficar online`,
          });
        }
      });
  }, [userRole, notifiedUsers]);

  usePresence(handleUserOnline);
  
  
  const [audio] = useState(() => {
    // Criar um tom de notificação usando Web Audio API para mais confiabilidade
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return {
      play: () => {
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Configurar o tom
          oscillator.frequency.value = 800; // Frequência em Hz
          gainNode.gain.value = 0.3; // Volume
          
          // Tocar o som
          oscillator.start(audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
          );
          oscillator.stop(audioContext.currentTime + 0.3);
          
          console.log('🔊 Som de notificação tocado');
        } catch (err) {
          console.error('Erro ao tocar som:', err);
        }
      }
    };
  });

  useEffect(() => {
    if (!user) return;

    loadNotifications();
    
    // Configurar realtime para novas mensagens
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_messages',
        },
        async (payload: any) => {
          console.log('🔔 Nova mensagem detectada:', payload);
          
          // Verificar se a mensagem não é do próprio usuário
          if (payload.new.user_id === user.id) {
            console.log('⏭️ Ignorando mensagem própria');
            return;
          }

          // Buscar informações da solicitação e do usuário que enviou
          const { data: request } = await supabase
            .from('requests')
            .select('id, protocol, assunto, client_id')
            .eq('id', payload.new.request_id)
            .single();

          if (!request) return;

          // Verificar se o usuário deve receber essa notificação
          let shouldNotify = false;
          
          if (userRole === 'cliente') {
            // Cliente só vê notificações das próprias solicitações
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', user.id)
              .single();

            const { data: client } = await supabase
              .from('clients')
              .select('id')
              .eq('email', profile?.email || '')
              .single();

            shouldNotify = client?.id === request.client_id;
          } else {
            // Admin e colaboradores veem todas as notificações
            shouldNotify = true;
          }

          if (shouldNotify) {
            // Buscar perfil de quem enviou a mensagem
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('nome, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const newNotification: Notification = {
              id: `msg-${payload.new.id}`,
              request_id: request.id,
              protocol: request.protocol,
              assunto: request.assunto,
              tipo: 'nova_mensagem',
              created_at: payload.new.created_at,
              lida: false,
              user_nome: senderProfile?.nome,
              user_avatar: senderProfile?.avatar_url,
            };

            console.log('✅ Adicionando notificação:', newNotification);
            
            setNotifications(prev => {
              // Evitar duplicatas
              if (prev.some(n => n.id === newNotification.id)) {
                return prev;
              }
              return [newNotification, ...prev];
            });
            
            setUnreadCount(prev => prev + 1);
            playNotificationSound();
            
            toast({
              title: '💬 Nova mensagem',
              description: `${senderProfile?.nome || 'Alguém'} enviou uma mensagem em #${request.protocol}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
        },
        async (payload: any) => {
          console.log('🔄 Status de solicitação atualizado:', payload);
          
          // Verificar se houve mudança de status
          if (payload.old.status !== payload.new.status) {
            const { data: request } = await supabase
              .from('requests')
              .select('id, protocol, assunto, client_id')
              .eq('id', payload.new.id)
              .single();

            if (!request) return;

            // Verificar se o usuário deve receber essa notificação
            let shouldNotify = false;
            
            if (userRole === 'cliente') {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', user.id)
                .single();

              const { data: client } = await supabase
                .from('clients')
                .select('id')
                .eq('email', profile?.email || '')
                .single();

              shouldNotify = client?.id === request.client_id;
            } else {
              shouldNotify = true;
            }

            if (shouldNotify) {
              const statusLabels: Record<string, string> = {
                aberto: 'Aberto',
                em_atendimento: 'Em Atendimento',
                concluido: 'Concluído',
              };

              const newNotification: Notification = {
                id: `status-${request.id}-${Date.now()}`,
                request_id: request.id,
                protocol: request.protocol,
                assunto: request.assunto,
                tipo: 'status_alterado',
                created_at: new Date().toISOString(),
                lida: false,
              };

              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              playNotificationSound();
              
              toast({
                title: '🔄 Status alterado',
                description: `#${request.protocol} está agora ${statusLabels[payload.new.status]}`,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Status do canal de notificações:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const playNotificationSound = () => {
    try {
      audio.play();
    } catch (err) {
      console.log('Erro ao tocar som:', err);
    }
  };

  const loadNotifications = async () => {
    if (!user || !userRole) return;

    try {
      // Buscar mensagens não lidas
      let messagesQuery = supabase
        .from('request_messages')
        .select(`
          id,
          request_id,
          user_id,
          created_at,
          lida,
          requests!inner(
            id,
            protocol,
            assunto,
            client_id
          )
        `)
        .eq('lida', false)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Filtrar por cliente se for usuário cliente
      if (userRole === 'cliente') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (!profile) return;

        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('email', profile.email)
          .single();

        if (!client) return;

        messagesQuery = messagesQuery.eq('requests.client_id', client.id);
      }

      const { data: unreadMessages, error } = await messagesQuery;

      if (error) {
        console.error('Erro ao buscar mensagens não lidas:', error);
        return;
      }

      if (!unreadMessages || unreadMessages.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Agrupar por request_id para evitar múltiplas notificações da mesma solicitação
      const notificationsByRequest = new Map<string, any>();
      
      for (const message of unreadMessages) {
        const requestId = message.request_id;
        if (!notificationsByRequest.has(requestId)) {
          notificationsByRequest.set(requestId, {
            id: `request-${requestId}`,
            request_id: requestId,
            protocol: (message.requests as any).protocol,
            assunto: (message.requests as any).assunto,
            tipo: 'nova_mensagem' as const,
            created_at: message.created_at,
            lida: false,
            unread_count: 1,
          });
        } else {
          const existing = notificationsByRequest.get(requestId);
          existing.unread_count += 1;
          // Manter a mensagem mais recente
          if (message.created_at > existing.created_at) {
            existing.created_at = message.created_at;
          }
        }
      }

      const notifications = Array.from(notificationsByRequest.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setNotifications(notifications);
      setUnreadCount(notifications.length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const checkNewNotification = async () => {
    await loadNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🔍 Clicando na notificação:', notification);
    
    if (notification.user_id) {
      // Se é notificação de presença, ir para atendimento
      navigate('/atendimento');
    } else if (notification.request_id) {
      // Marcar todas as mensagens dessa solicitação como lidas
      try {
        await supabase
          .from('request_messages')
          .update({ lida: true, lida_em: new Date().toISOString() })
          .eq('request_id', notification.request_id)
          .neq('user_id', user?.id || '');
        
        console.log('✅ Mensagens marcadas como lidas');
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      }

      // Se é notificação de request, ir para a página de solicitações
      // e passar o request_id via state para abrir automaticamente
      if (userRole === 'cliente') {
        navigate('/solicitacoes', { 
          state: { openRequestId: notification.request_id } 
        });
      } else {
        navigate('/solicitacoes-internas', { 
          state: { openRequestId: notification.request_id } 
        });
      }
    }
    
    // Remover notificação da lista
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAsRead = async () => {
    try {
      // Marcar todas as mensagens não lidas como lidas
      const requestIds = notifications
        .filter(n => n.request_id)
        .map(n => n.request_id);

      if (requestIds.length > 0) {
        await supabase
          .from('request_messages')
          .update({ lida: true, lida_em: new Date().toISOString() })
          .in('request_id', requestIds)
          .neq('user_id', user?.id || '');
        
        console.log('✅ Todas as mensagens marcadas como lidas');
      }

      setUnreadCount(0);
      setNotifications([]);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAsRead}>
                Marcar como lidas
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                      !notif.lida ? 'bg-primary/5 border-primary/20' : 'border-border'
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3">
                      {notif.tipo === 'usuario_online' && (
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={notif.user_avatar} alt={notif.user_nome} />
                          <AvatarFallback>
                            {notif.user_nome?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {notif.tipo === 'nova_mensagem' && 'Nova mensagem'}
                          {notif.tipo === 'status_alterado' && 'Status alterado'}
                          {notif.tipo === 'usuario_online' && '🟢 Colaborador online'}
                        </p>
                        {notif.tipo === 'usuario_online' ? (
                          <p className="text-sm text-muted-foreground truncate">
                            {notif.assunto}
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground truncate">
                              #{notif.protocol} - {notif.assunto}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(notif.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                              {(notif as any).unread_count && (notif as any).unread_count > 1 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                                  {(notif as any).unread_count}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {!notif.lida && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
