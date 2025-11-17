-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'colaborador', 'cliente');

-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar tabela de roles dos usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_razao_social TEXT NOT NULL,
  cnpj_cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  situacao TEXT DEFAULT 'Ativo' NOT NULL CHECK (situacao IN ('Ativo', 'Inativo')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar storage bucket para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela de documentos
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  competencia TEXT NOT NULL,
  vencimento DATE,
  valor_guia DECIMAL(10,2),
  pago BOOLEAN DEFAULT false NOT NULL,
  data_envio TIMESTAMPTZ DEFAULT now() NOT NULL,
  data_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Criar triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para profiles
CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins e colaboradores podem ver todos perfis"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'colaborador'));

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Sistema pode inserir perfis"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- RLS Policies para user_roles
CREATE POLICY "Usuários podem ver própria role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- RLS Policies para clients
CREATE POLICY "Admins e colaboradores podem ver clientes"
  ON public.clients FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'colaborador'));

CREATE POLICY "Admins e colaboradores podem criar clientes"
  ON public.clients FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'colaborador'));

CREATE POLICY "Admins e colaboradores podem atualizar clientes"
  ON public.clients FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'colaborador'));

CREATE POLICY "Admins podem deletar clientes"
  ON public.clients FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para documents
CREATE POLICY "Todos usuários autenticados podem ver documentos"
  ON public.documents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'colaborador')
    OR EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = documents.client_id
      AND clients.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins e colaboradores podem criar documentos"
  ON public.documents FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'colaborador'));

CREATE POLICY "Admins e colaboradores podem atualizar documentos"
  ON public.documents FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'colaborador'));

CREATE POLICY "Clientes podem atualizar status de pagamento"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = documents.client_id
      AND clients.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins podem deletar documentos"
  ON public.documents FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies para documents bucket
CREATE POLICY "Admins e colaboradores podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' 
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'colaborador'))
  );

CREATE POLICY "Usuários autenticados podem baixar documentos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admins podem deletar documentos do storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' 
    AND public.has_role(auth.uid(), 'admin')
  );