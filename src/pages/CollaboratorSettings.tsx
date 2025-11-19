import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type CollaboratorPermission = {
  id: string;
  user_id: string;
  can_edit_client_situation: boolean;
  can_delete_clients: boolean;
  can_manage_requests: boolean;
  can_view_reports: boolean;
};

type Collaborator = {
  id: string;
  nome: string;
  email: string;
  permissions?: CollaboratorPermission;
};

export default function CollaboratorSettings() {
  const { user, userRole } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchCollaborators();
    }
  }, [userRole]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);

      // Buscar usuários com role de colaborador
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'colaborador');

      if (rolesError) throw rolesError;

      const collaboratorIds = rolesData.map(r => r.user_id);

      if (collaboratorIds.length === 0) {
        setCollaborators([]);
        return;
      }

      // Buscar perfis dos colaboradores
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', collaboratorIds);

      if (profilesError) throw profilesError;

      // Buscar permissões dos colaboradores
      const { data: permissionsData } = await supabase
        .from('collaborator_permissions')
        .select('*')
        .in('user_id', collaboratorIds);

      // Combinar dados
      const collaboratorsWithPermissions = profilesData.map(profile => ({
        ...profile,
        permissions: permissionsData?.find(p => p.user_id === profile.id),
      }));

      setCollaborators(collaboratorsWithPermissions);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar colaboradores',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    userId: string,
    field: keyof Omit<CollaboratorPermission, 'id' | 'user_id'>,
    value: boolean
  ) => {
    try {
      setSaving(userId);

      const collaborator = collaborators.find(c => c.id === userId);
      
      if (!collaborator?.permissions) {
        // Criar permissões se não existirem
        const { error } = await supabase
          .from('collaborator_permissions')
          .insert({
            user_id: userId,
            [field]: value,
          });

        if (error) throw error;
      } else {
        // Atualizar permissões existentes
        const { error } = await supabase
          .from('collaborator_permissions')
          .update({ [field]: value })
          .eq('user_id', userId);

        if (error) throw error;
      }

      toast({
        title: 'Permissão atualizada',
        description: 'As permissões do colaborador foram atualizadas com sucesso.',
      });

      await fetchCollaborators();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar permissão',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  if (userRole !== 'admin') {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Colaboradores</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as permissões dos colaboradores do sistema
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : collaborators.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Nenhum colaborador cadastrado no sistema.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {collaborators.map((collaborator) => (
              <Card key={collaborator.id}>
                <CardHeader>
                  <CardTitle>{collaborator.nome}</CardTitle>
                  <CardDescription>{collaborator.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={`edit-situation-${collaborator.id}`}>
                          Editar Situação de Clientes
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Permite alterar o status (Ativo/Inativo/Suspenso) dos clientes
                        </p>
                      </div>
                      <Switch
                        id={`edit-situation-${collaborator.id}`}
                        checked={collaborator.permissions?.can_edit_client_situation || false}
                        onCheckedChange={(checked) =>
                          updatePermission(collaborator.id, 'can_edit_client_situation', checked)
                        }
                        disabled={saving === collaborator.id}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={`delete-clients-${collaborator.id}`}>
                          Deletar Clientes
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Permite excluir clientes do sistema
                        </p>
                      </div>
                      <Switch
                        id={`delete-clients-${collaborator.id}`}
                        checked={collaborator.permissions?.can_delete_clients || false}
                        onCheckedChange={(checked) =>
                          updatePermission(collaborator.id, 'can_delete_clients', checked)
                        }
                        disabled={saving === collaborator.id}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={`manage-requests-${collaborator.id}`}>
                          Gerenciar Solicitações
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Permite criar, editar e responder solicitações
                        </p>
                      </div>
                      <Switch
                        id={`manage-requests-${collaborator.id}`}
                        checked={collaborator.permissions?.can_manage_requests ?? true}
                        onCheckedChange={(checked) =>
                          updatePermission(collaborator.id, 'can_manage_requests', checked)
                        }
                        disabled={saving === collaborator.id}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={`view-reports-${collaborator.id}`}>
                          Visualizar Relatórios
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Permite acessar a página de relatórios e estatísticas
                        </p>
                      </div>
                      <Switch
                        id={`view-reports-${collaborator.id}`}
                        checked={collaborator.permissions?.can_view_reports ?? true}
                        onCheckedChange={(checked) =>
                          updatePermission(collaborator.id, 'can_view_reports', checked)
                        }
                        disabled={saving === collaborator.id}
                      />
                    </div>
                  </div>

                  {saving === collaborator.id && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
