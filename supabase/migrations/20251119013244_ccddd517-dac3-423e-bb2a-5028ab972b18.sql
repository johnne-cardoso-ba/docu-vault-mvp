-- Habilitar Realtime para as tabelas de solicitações
ALTER TABLE public.requests REPLICA IDENTITY FULL;
ALTER TABLE public.request_messages REPLICA IDENTITY FULL;
ALTER TABLE public.request_history REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação do Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_history;