import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type Collaborator = {
  id: string;
  email: string;
  nome: string;
  role: string;
  setor: string | null;
};

type EditCollaboratorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: Collaborator | null;
  onEditComplete: () => void;
};

export function EditCollaboratorDialog({
  open,
  onOpenChange,
  collaborator,
  onEditComplete,
}: EditCollaboratorDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    role: 'colaborador',
    setor: 'geral' as 'geral' | 'fiscal' | 'pessoal' | 'contabil' | 'controladoria' | 'procuradoria',
  });

  useEffect(() => {
    if (collaborator) {
      setFormData({
        nome: collaborator.nome,
        role: collaborator.role as 'admin' | 'colaborador',
        setor: (collaborator.setor || 'geral') as 'geral' | 'fiscal' | 'pessoal' | 'contabil' | 'controladoria' | 'procuradoria',
      });
    }
  }, [collaborator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaborator) return;
    
    setIsSaving(true);

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          setor: formData.setor === 'geral' ? null : formData.setor,
        })
        .eq('id', collaborator.id);

      if (profileError) throw profileError;

      // Atualizar role se mudou
      if (formData.role !== collaborator.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role as 'admin' | 'colaborador' })
          .eq('user_id', collaborator.id);

        if (roleError) throw roleError;
      }

      toast({ title: 'Colaborador atualizado com sucesso!' });
      onEditComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar colaborador',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
          <DialogDescription>
            Atualize as informações do colaborador
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={collaborator?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Tipo *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colaborador">Colaborador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="setor">Setor</Label>
            <Select
              value={formData.setor}
              onValueChange={(value) => setFormData({ ...formData, setor: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral (todos os setores)</SelectItem>
                <SelectItem value="fiscal">Fiscal</SelectItem>
                <SelectItem value="pessoal">Pessoal</SelectItem>
                <SelectItem value="contabil">Contábil</SelectItem>
                <SelectItem value="controladoria">Controladoria</SelectItem>
                <SelectItem value="procuradoria">Procuradoria</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se vazio, o colaborador receberá solicitações de todos os setores
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
