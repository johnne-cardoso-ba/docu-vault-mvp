-- Criar enum para setores da contabilidade
CREATE TYPE public.setor_contabilidade AS ENUM (
  'fiscal',
  'pessoal',
  'contabil',
  'controladoria',
  'procuradoria'
);

-- Criar enum para status das solicitações
CREATE TYPE public.status_solicitacao AS ENUM (
  'aberto',
  'em_atendimento',
  'concluido'
);

-- Criar tabela de solicitações
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL,
  setor setor_contabilidade NOT NULL,
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status status_solicitacao NOT NULL DEFAULT 'aberto',
  atendente_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Criar tabela de mensagens das solicitações
CREATE TABLE public.request_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tipo_mensagem TEXT NOT NULL CHECK (tipo_mensagem IN ('texto', 'arquivo', 'audio')),
  conteudo TEXT,
  file_url TEXT,
  filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);

-- Criar tabela de histórico de mudanças
CREATE TABLE public.request_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  tipo_mudanca TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_request_history FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);

-- Criar bucket de storage para arquivos das solicitações
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-files', 'request-files', false)
ON CONFLICT (id) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX idx_requests_client ON requests(client_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_setor ON requests(setor);
CREATE INDEX idx_request_messages_request ON request_messages(request_id);
CREATE INDEX idx_request_history_request ON request_history(request_id);

-- Habilitar RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;

-- RLS policies para requests
CREATE POLICY "Clientes podem ver próprias solicitações"
ON public.requests FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Admins e colaboradores podem ver todas solicitações"
ON public.requests FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'colaborador'::app_role)
);

CREATE POLICY "Clientes podem criar solicitações"
ON public.requests FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Admins e colaboradores podem atualizar solicitações"
ON public.requests FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'colaborador'::app_role)
);

-- RLS policies para request_messages
CREATE POLICY "Usuários podem ver mensagens de suas solicitações"
ON public.request_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requests r
    WHERE r.id = request_messages.request_id
    AND (
      r.client_id IN (
        SELECT id FROM clients WHERE email = (
          SELECT email FROM profiles WHERE id = auth.uid()
        )
      )
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'colaborador'::app_role)
    )
  )
);

CREATE POLICY "Usuários podem criar mensagens em suas solicitações"
ON public.request_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM requests r
    WHERE r.id = request_messages.request_id
    AND (
      r.client_id IN (
        SELECT id FROM clients WHERE email = (
          SELECT email FROM profiles WHERE id = auth.uid()
        )
      )
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'colaborador'::app_role)
    )
  )
);

-- RLS policies para request_history
CREATE POLICY "Usuários podem ver histórico de suas solicitações"
ON public.request_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requests r
    WHERE r.id = request_history.request_id
    AND (
      r.client_id IN (
        SELECT id FROM clients WHERE email = (
          SELECT email FROM profiles WHERE id = auth.uid()
        )
      )
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'colaborador'::app_role)
    )
  )
);

CREATE POLICY "Sistema pode criar histórico"
ON public.request_history FOR INSERT
WITH CHECK (true);

-- Storage policies para request-files
CREATE POLICY "Usuários podem fazer upload de arquivos em suas solicitações"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'request-files' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'colaborador'::app_role) OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Usuários podem ver arquivos de suas solicitações"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-files' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'colaborador'::app_role) OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar protocolo sequencial
CREATE OR REPLACE FUNCTION generate_protocol()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_prefix TEXT;
  next_number INTEGER;
  protocol TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocol FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM requests
  WHERE protocol LIKE year_prefix || '%';
  
  protocol := year_prefix || LPAD(next_number::TEXT, 6, '0');
  
  RETURN protocol;
END;
$$;

-- Trigger para gerar protocolo automaticamente
CREATE OR REPLACE FUNCTION set_request_protocol()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.protocol IS NULL OR NEW.protocol = '' THEN
    NEW.protocol := generate_protocol();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_request_protocol
BEFORE INSERT ON public.requests
FOR EACH ROW
EXECUTE FUNCTION set_request_protocol();