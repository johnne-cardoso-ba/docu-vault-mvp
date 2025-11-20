-- Adicionar política para permitir que admins e colaboradores criem solicitações para clientes
CREATE POLICY "Admins e colaboradores podem criar solicitações para clientes"
ON public.requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'colaborador'::app_role)
);