import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

type Collaborator = {
  id: string;
  email: string;
  nome: string;
};

type DeleteCollaboratorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: Collaborator | null;
  onDeleteComplete: () => void;
};

export function DeleteCollaboratorDialog({
  open,
  onOpenChange,
  collaborator,
  onDeleteComplete,
}: DeleteCollaboratorDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaborator) return;

    setIsDeleting(true);

    try {
      // Verificar senha do admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      // Tentar fazer login com a senha fornecida para validar
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      });

      if (authError) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha fornecida está incorreta',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      // Deletar role do usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', collaborator.id);

      if (roleError) throw roleError;

      // Deletar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', collaborator.id);

      if (profileError) throw profileError;

      toast({ title: 'Colaborador excluído com sucesso!' });
      setPassword('');
      onDeleteComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir colaborador',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>Excluir Colaborador</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O colaborador <strong>{collaborator?.nome}</strong> será
            permanentemente excluído do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Digite sua senha para confirmar *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha do administrador"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPassword('');
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Colaborador'
              )}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
