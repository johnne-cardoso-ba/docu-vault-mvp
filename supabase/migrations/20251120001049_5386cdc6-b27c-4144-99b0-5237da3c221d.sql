-- Adicionar client_id à tabela nfse_config para relacionar configurações com clientes
ALTER TABLE public.nfse_config
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_nfse_config_client_id ON public.nfse_config(client_id);

-- Atualizar RLS policies para permitir que clientes vejam e editem suas próprias configurações
DROP POLICY IF EXISTS "Admins podem ver configurações" ON public.nfse_config;
DROP POLICY IF EXISTS "Admins podem inserir configurações" ON public.nfse_config;
DROP POLICY IF EXISTS "Admins podem atualizar configurações" ON public.nfse_config;

-- Admins podem ver todas configurações
CREATE POLICY "Admins podem ver configurações"
ON public.nfse_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Clientes podem ver suas próprias configurações
CREATE POLICY "Clientes podem ver própria configuração"
ON public.nfse_config
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND tem_acesso_nfse = true
  )
);

-- Admins podem inserir configurações
CREATE POLICY "Admins podem inserir configurações"
ON public.nfse_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Clientes autorizados podem inserir suas próprias configurações
CREATE POLICY "Clientes podem inserir própria configuração"
ON public.nfse_config
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients 
    WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND tem_acesso_nfse = true
  )
);

-- Admins podem atualizar configurações
CREATE POLICY "Admins podem atualizar configurações"
ON public.nfse_config
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Clientes podem atualizar suas próprias configurações
CREATE POLICY "Clientes podem atualizar própria configuração"
ON public.nfse_config
FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND tem_acesso_nfse = true
  )
);