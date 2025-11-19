-- Adicionar policies para clientes com acesso ao módulo NFS-e
CREATE POLICY "Clientes autorizados podem ver suas NFS-e"
ON public.nfse_emitidas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = nfse_emitidas.client_id
    AND clients.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    AND clients.tem_acesso_nfse = true
  )
);