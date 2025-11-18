-- Adicionar política para permitir que clientes vejam seu próprio registro na tabela clients
CREATE POLICY "Clientes podem ver próprio registro"
ON public.clients
FOR SELECT
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);