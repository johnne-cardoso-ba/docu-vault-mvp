-- Allow admins to manage all user_roles
CREATE POLICY "Admins podem ver todas roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() <> user_id);

-- Allow admins to update any profile
CREATE POLICY "Admins podem atualizar todos perfis"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));