-- Ajustar RLS da tabela nfse_emitidas para remover acesso de colaboradores
ALTER TABLE public.nfse_emitidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins e colaboradores podem emitir NFS-e" ON public.nfse_emitidas;
DROP POLICY IF EXISTS "Admins e colaboradores podem atualizar NFS-e" ON public.nfse_emitidas;
DROP POLICY IF EXISTS "Admins e colaboradores podem ver NFS-e" ON public.nfse_emitidas;

CREATE POLICY "Admins podem emitir NFS-e"
ON public.nfse_emitidas
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar NFS-e"
ON public.nfse_emitidas
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver NFS-e"
ON public.nfse_emitidas
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
