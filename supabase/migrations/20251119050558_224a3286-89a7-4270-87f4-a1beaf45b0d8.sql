-- Adicionar campo para CNAEs secundários
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS cnaes_secundarios JSONB DEFAULT '[]'::jsonb;