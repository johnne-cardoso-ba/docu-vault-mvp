-- Adicionar campo tem_acesso_nfse na tabela clients
ALTER TABLE public.clients 
ADD COLUMN tem_acesso_nfse boolean NOT NULL DEFAULT false;

-- Adicionar índice para melhorar performance nas queries
CREATE INDEX idx_clients_tem_acesso_nfse ON public.clients(tem_acesso_nfse);