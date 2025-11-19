import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewRequestDialog } from '@/components/requests/NewRequestDialog';
import { RequestsList } from '@/components/requests/RequestsList';
import { useAuth } from '@/hooks/useAuth';

export default function Requests() {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const { userRole } = useAuth();
  const location = useLocation();
  const openRequestId = (location.state as any)?.openRequestId;

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

        <RequestsList openRequestId={openRequestId} />

        <NewRequestDialog 
          open={isNewRequestOpen} 
          onOpenChange={setIsNewRequestOpen}
        />
      </div>
    </AppLayout>
  );
}
