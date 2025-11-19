-- Adicionar novos campos à tabela clients para cadastro completo
ALTER TABLE public.clients
  -- Separar CPF e CNPJ
  ADD COLUMN cpf TEXT,
  ADD COLUMN cnpj TEXT,
  
  -- Dados societários
  ADD COLUMN nome_socio TEXT,
  ADD COLUMN data_nascimento DATE,
  
  -- Registro JUCEB
  ADD COLUMN juceb_nire TEXT,
  ADD COLUMN juceb_protocolo TEXT,
  ADD COLUMN juceb_data_registro DATE,
  
  -- Documentos fiscais
  ADD COLUMN numero_iptu TEXT,
  ADD COLUMN numero_titulo TEXT,
  ADD COLUMN codigo_simples TEXT,
  ADD COLUMN inscricao_estadual TEXT,
  ADD COLUMN inscricao_municipal TEXT,
  
  -- Endereço completo
  ADD COLUMN cep TEXT,
  ADD COLUMN logradouro TEXT,
  ADD COLUMN numero TEXT,
  ADD COLUMN complemento TEXT,
  ADD COLUMN bairro TEXT,
  ADD COLUMN cidade TEXT,
  ADD COLUMN estado TEXT,
  
  -- Informações adicionais
  ADD COLUMN atividade_principal TEXT,
  ADD COLUMN regime_tributario TEXT,
  ADD COLUMN responsavel_legal TEXT,
  
  -- Campos customizados (JSON para flexibilidade)
  ADD COLUMN campos_customizados JSONB DEFAULT '{}'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.clients.campos_customizados IS 'Campo JSON para armazenar campos personalizados adicionados pelo contador';
COMMENT ON COLUMN public.clients.cnpj_cpf IS 'Campo legado - manter para compatibilidade';
COMMENT ON COLUMN public.clients.cpf IS 'CPF do cliente pessoa física';
COMMENT ON COLUMN public.clients.cnpj IS 'CNPJ do cliente pessoa jurídica';