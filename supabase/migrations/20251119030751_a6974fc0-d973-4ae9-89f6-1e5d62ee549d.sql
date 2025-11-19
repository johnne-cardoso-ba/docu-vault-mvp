-- Adicionar campo de avatar_url na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil do usuário';