import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { InternalRequestsList } from '@/components/requests/InternalRequestsList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewInternalRequestDialog } from '@/components/requests/NewInternalRequestDialog';

export default function InternalRequests() {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const location = useLocation();
  const openRequestId = (location.state as any)?.openRequestId;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Atendimento</h1>
            <p className="text-muted-foreground">Gerencie todas as solicitações dos clientes</p>
          </div>
          <Button onClick={() => setIsNewRequestOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Solicitação
          </Button>
        </div>

        <InternalRequestsList openRequestId={openRequestId} />

        <NewInternalRequestDialog 
          open={isNewRequestOpen} 
          onOpenChange={setIsNewRequestOpen}
        />
      </div>
    </AppLayout>
  );
}
