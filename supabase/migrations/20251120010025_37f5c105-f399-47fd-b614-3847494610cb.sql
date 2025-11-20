-- Permitir que admins excluam solicitações
CREATE POLICY "Admins podem excluir solicitações"
ON public.requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins excluam histórico
CREATE POLICY "Admins podem excluir histórico"
ON public.request_history
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins excluam avaliações
CREATE POLICY "Admins podem excluir avaliações"
ON public.request_ratings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));