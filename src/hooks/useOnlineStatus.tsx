import { usePresence } from './usePresence';

export function useOnlineStatus() {
  const { onlineUsers } = usePresence();
  
  const isOnline = (userId: string | undefined) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  return { isOnline, onlineUsers };
}
