-- Permitir que admins excluam mensagens
CREATE POLICY "Admins podem excluir mensagens"
ON public.request_messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);