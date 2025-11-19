-- Adicionar campo para rastrear leitura de mensagens
ALTER TABLE public.request_messages
ADD COLUMN lida BOOLEAN DEFAULT false,
ADD COLUMN lida_em TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN public.request_messages.lida IS 'Indica se a mensagem foi lida';
COMMENT ON COLUMN public.request_messages.lida_em IS 'Data e hora em que a mensagem foi lida';