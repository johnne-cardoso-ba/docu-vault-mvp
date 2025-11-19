import { useState, useEffect } from 'react';
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
  
  // Configurar presença e detectar usuários online (apenas para admins e colaboradores)
  usePresence(userRole === 'cliente' ? undefined : (onlineUser) => {
    // Verificar se é colaborador/admin antes de notificar
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', onlineUser.user_id)
      .single()
      .then(({ data }) => {
        // Só notificar se for colaborador ou admin (não notificar clientes)
        if (data && (data.role === 'colaborador' || data.role === 'admin')) {
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
  });
  
  const [audio] = useState(() => {
    const audio = new Audio();
    // Som de notificação (usando um tom simples)
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZjTgIGGi77eeeTRAMUKfi8LZjHAY4ktfxy3ksBS' +
      'F3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Y04CBhquvr45poNChVowOmyZBwGOJLX8ct5LAUhd8fw3ZBAChRetevrqFUUCkee4PK+bCEFK4Lb8tmNOAgYarvt555NEAxQp+LwtmMcBjiS1/HLeSsGIXfH8N+QQAoUXrXr66hVFApHnuDyv2whBSyC2/LZjTgIGGu77eeeTRAMUKfi8LZjHAY4ktfxy3ksBS' +
      'J3x/DdkEAKFF607+uoVRQKR5/g8r5sIQUsgs7y2Y04CBtsvetmMcBjiS1/HMeS' +
      'wFIXfH8N2QQAoUXbXr66hVFApHn+DyvmwhBSyC2/LZjTgIG2y+72YxwGOJLX8ct5LAUid8fw3ZBAChRevev7qFUU';
    audio.volume = 0.5;
    return audio;
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
        async (payload) => {
          // Verificar se a mensagem não é do próprio usuário
          if (payload.new.user_id !== user.id) {
            await checkNewNotification();
            playNotificationSound();
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
        async (payload) => {
          await checkNewNotification();
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const playNotificationSound = () => {
    audio.play().catch(err => console.log('Erro ao tocar som:', err));
  };

  const loadNotifications = async () => {
    if (!user || !userRole) return;

    try {
      // Buscar solicitações com novas mensagens
      let query = supabase
        .from('requests')
        .select('id, protocol, assunto, status, updated_at');

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

        query = query.eq('client_id', client.id);
      }

      const { data: requests } = await query;

      if (!requests) return;

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const filteredRequests = (requests as any[]).filter((r) => {
        const isRecent = r.updated_at > twentyFourHoursAgo;
        const isResponseForClient = userRole === 'cliente' ? r.status !== 'aberto' : true;
        return isRecent && isResponseForClient;
      });

      const notifications: Notification[] = filteredRequests
        .map((r) => ({
          id: r.id,
          request_id: r.id,
          protocol: r.protocol,
          assunto: r.assunto,
          tipo: 'nova_mensagem' as const,
          created_at: r.updated_at,
          lida: false,
        }))
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

  const handleNotificationClick = (requestId: string, userId?: string) => {
    if (userId) {
      // Se é notificação de presença, ir para atendimento
      navigate('/atendimento');
    } else if (requestId) {
      // Se é notificação de request, ir para o request específico
      if (userRole === 'cliente') {
        navigate(`/solicitacoes`);
      } else {
        navigate('/solicitacoes-internas');
      }
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, lida: true })));
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
                    onClick={() => handleNotificationClick(notif.request_id, notif.user_id)}
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
                          <p className="text-sm text-muted-foreground truncate">
                            #{notif.protocol} - {notif.assunto}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notif.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
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
