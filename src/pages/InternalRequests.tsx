import { AppLayout } from '@/components/AppLayout';
import { InternalRequestsList } from '@/components/requests/InternalRequestsList';

export default function InternalRequests() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel de Atendimento</h1>
          <p className="text-muted-foreground">Gerencie todas as solicitações dos clientes</p>
        </div>

        <InternalRequestsList />
      </div>
    </AppLayout>
  );
}
