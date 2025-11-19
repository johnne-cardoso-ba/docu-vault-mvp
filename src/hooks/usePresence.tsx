import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

type OnlineNotification = {
  user_id: string;
  nome: string;
  avatar_url?: string;
};

export function usePresence(onUserOnline?: (user: OnlineNotification) => void) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [previousOnlineUsers, setPreviousOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Create a channel for presence
    const presenceChannel = supabase.channel('online-collaborators', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Listen to presence state changes
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const userIds = new Set<string>();
        const newUsers: OnlineNotification[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (Array.isArray(presences)) {
            presences.forEach((presence: any) => {
              if (presence.user_id) {
                userIds.add(presence.user_id);
                
                // Detectar novos usuários online
                if (!previousOnlineUsers.has(presence.user_id) && presence.user_id !== user?.id) {
                  newUsers.push({
                    user_id: presence.user_id,
                    nome: presence.nome,
                    avatar_url: presence.avatar_url,
                  });
                }
              }
            });
          }
        });
        
        // Notificar sobre novos usuários online
        if (newUsers.length > 0 && onUserOnline) {
          newUsers.forEach(newUser => onUserOnline(newUser));
        }
        
        setPreviousOnlineUsers(userIds);
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, avatar_url')
            .eq('id', user.id)
            .single();

          // Track presence
          await presenceChannel.track({
            user_id: user.id,
            nome: profile?.nome || 'Usuário',
            avatar_url: profile?.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user]);

  return { onlineUsers, channel };
}
