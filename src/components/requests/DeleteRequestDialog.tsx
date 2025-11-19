import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onDeleteComplete: () => void;
}

export function DeleteRequestDialog({ open, onOpenChange, request, onDeleteComplete }: DeleteRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleDelete = async () => {
    if (!password) {
      toast({
        title: 'Senha obrigatória',
        description: 'Por favor, insira sua senha para confirmar a exclusão.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar senha do admin
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        throw new Error('Senha incorreta');
      }

      // Excluir mensagens relacionadas
      const { error: messagesError } = await supabase
        .from('request_messages')
        .delete()
        .eq('request_id', request.id);

      if (messagesError) throw messagesError;

      // Excluir histórico
      const { error: historyError } = await supabase
        .from('request_history')
        .delete()
        .eq('request_id', request.id);

      if (historyError) throw historyError;

      // Excluir avaliação se existir
      await supabase
        .from('request_ratings')
        .delete()
        .eq('request_id', request.id);

      // Excluir a solicitação
      const { error: requestError } = await supabase
        .from('requests')
        .delete()
        .eq('id', request.id);

      if (requestError) throw requestError;

      toast({
        title: 'Protocolo excluído',
        description: `O protocolo #${request.protocol} foi excluído com sucesso.`,
      });

      setPassword('');
      onOpenChange(false);
      onDeleteComplete();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir protocolo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Protocolo
          </DialogTitle>
          <DialogDescription>
            Você está prestes a excluir permanentemente o protocolo #{request?.protocol}.
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive">
              Atenção: Esta ação é irreversível!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as mensagens, histórico e avaliações relacionadas a este protocolo serão
              permanentemente excluídas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Confirme sua senha *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha para confirmar"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPassword('');
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Protocolo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
