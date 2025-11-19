-- Adicionar coluna de setor na tabela profiles para colaboradores
ALTER TABLE profiles 
ADD COLUMN setor setor_contabilidade;

-- Adicionar comentário explicando que o campo é para colaboradores
COMMENT ON COLUMN profiles.setor IS 'Setor do colaborador (apenas para admins e colaboradores). NULL significa que o colaborador recebe solicitações de todos os setores (geral).';