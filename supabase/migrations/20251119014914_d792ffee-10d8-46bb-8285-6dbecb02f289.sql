-- Criar tabela de avaliações de atendimento
CREATE TABLE IF NOT EXISTS public.request_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  atendente_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(request_id)
);

-- Habilitar RLS
ALTER TABLE public.request_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para avaliações
CREATE POLICY "Clientes podem criar avaliações de suas solicitações"
ON public.request_ratings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.requests
    WHERE requests.id = request_ratings.request_id
    AND requests.client_id = request_ratings.client_id
  )
);

CREATE POLICY "Usuários podem ver avaliações de suas solicitações"
ON public.request_ratings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'colaborador'::app_role)
  OR client_id IN (
    SELECT id FROM clients WHERE email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Habilitar realtime para avaliações
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_ratings;