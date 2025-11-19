-- Remover policy que permite clientes verem NFS-e
DROP POLICY IF EXISTS "Clientes podem ver próprias NFS-e" ON public.nfse_emitidas;