-- Adicionar campo para múltiplos sócios na tabela clients
ALTER TABLE public.clients
  ADD COLUMN socios JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.clients.socios IS 'Array de objetos JSON contendo informações dos sócios: [{nome, cpf, capital, porcentagem}]';