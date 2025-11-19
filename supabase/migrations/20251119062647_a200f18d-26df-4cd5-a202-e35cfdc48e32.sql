-- Permitir que todos os usuários autenticados vejam perfis básicos (nome, avatar)
-- Isso é necessário para que clientes possam ver quem está respondendo suas mensagens
CREATE POLICY "Todos podem ver perfis básicos"
ON public.profiles
FOR SELECT
TO public
USING (true);