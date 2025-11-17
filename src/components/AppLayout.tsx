import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, mustChangePassword, setMustChangePassword } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
      
      {user && mustChangePassword && (
        <ChangePasswordDialog
          open={mustChangePassword}
          userId={user.id}
          onSuccess={() => setMustChangePassword(false)}
        />
      )}
    </SidebarProvider>
  );
}
