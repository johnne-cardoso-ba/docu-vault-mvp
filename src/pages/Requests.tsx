import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewRequestDialog } from '@/components/requests/NewRequestDialog';
import { RequestsList } from '@/components/requests/RequestsList';
import { useAuth } from '@/hooks/useAuth';

export default function Requests() {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const { userRole } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Minhas Solicitações</h1>
            <p className="text-muted-foreground">Gerencie suas solicitações e acompanhe o atendimento</p>
          </div>
          {userRole === 'cliente' && (
            <Button onClick={() => setIsNewRequestOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          )}
        </div>

        <RequestsList />

        <NewRequestDialog 
          open={isNewRequestOpen} 
          onOpenChange={setIsNewRequestOpen}
        />
      </div>
    </AppLayout>
  );
}
