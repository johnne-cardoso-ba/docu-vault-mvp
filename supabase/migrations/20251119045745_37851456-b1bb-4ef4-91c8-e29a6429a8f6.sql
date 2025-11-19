-- Criar tabela para configurações de permissões dos colaboradores
CREATE TABLE IF NOT EXISTS public.collaborator_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_edit_client_situation BOOLEAN NOT NULL DEFAULT false,
  can_delete_clients BOOLEAN NOT NULL DEFAULT false,
  can_manage_requests BOOLEAN NOT NULL DEFAULT true,
  can_view_reports BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.collaborator_permissions ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as permissões
CREATE POLICY "Admins podem ver permissões"
ON public.collaborator_permissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem criar permissões
CREATE POLICY "Admins podem criar permissões"
ON public.collaborator_permissions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem atualizar permissões
CREATE POLICY "Admins podem atualizar permissões"
ON public.collaborator_permissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem deletar permissões
CREATE POLICY "Admins podem deletar permissões"
ON public.collaborator_permissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Colaboradores podem ver suas próprias permissões
CREATE POLICY "Colaboradores podem ver próprias permissões"
ON public.collaborator_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_collaborator_permissions_updated_at
BEFORE UPDATE ON public.collaborator_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();