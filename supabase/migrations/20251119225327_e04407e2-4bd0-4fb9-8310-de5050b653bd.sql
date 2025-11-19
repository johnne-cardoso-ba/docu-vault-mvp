-- Tabela para configurações de NFS-e
CREATE TABLE public.nfse_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscricao_municipal text NOT NULL,
  certificado_a1 text NOT NULL, -- Base64 do certificado
  senha_certificado text NOT NULL,
  codigo_tributacao_municipio text NOT NULL,
  aliquota_iss numeric(5,2) NOT NULL DEFAULT 5.00,
  item_lista_servico text NOT NULL,
  cnae_fiscal text NOT NULL,
  descricao_servico text NOT NULL,
  ambiente text NOT NULL DEFAULT 'homologacao', -- 'homologacao' ou 'producao'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para histórico de NFS-e emitidas
CREATE TABLE public.nfse_emitidas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nota bigint,
  codigo_verificacao text,
  numero_rps bigint NOT NULL,
  serie_rps text NOT NULL DEFAULT 'RPS',
  tipo_rps integer NOT NULL DEFAULT 1,
  data_emissao timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'processando', -- 'processando', 'emitida', 'cancelada', 'erro'
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  tomador_cnpj_cpf text NOT NULL,
  tomador_razao_social text NOT NULL,
  tomador_endereco text,
  tomador_numero text,
  tomador_complemento text,
  tomador_bairro text,
  tomador_cidade text,
  tomador_uf text,
  tomador_cep text,
  tomador_email text,
  tomador_telefone text,
  valor_servicos numeric(15,2) NOT NULL,
  valor_deducoes numeric(15,2) DEFAULT 0,
  valor_pis numeric(15,2) DEFAULT 0,
  valor_cofins numeric(15,2) DEFAULT 0,
  valor_inss numeric(15,2) DEFAULT 0,
  valor_ir numeric(15,2) DEFAULT 0,
  valor_csll numeric(15,2) DEFAULT 0,
  iss_retido boolean DEFAULT false,
  valor_iss numeric(15,2) DEFAULT 0,
  valor_iss_retido numeric(15,2) DEFAULT 0,
  outras_retencoes numeric(15,2) DEFAULT 0,
  base_calculo numeric(15,2) NOT NULL,
  aliquota numeric(5,2) NOT NULL,
  valor_liquido_nfse numeric(15,2) NOT NULL,
  desconto_incondicionado numeric(15,2) DEFAULT 0,
  desconto_condicionado numeric(15,2) DEFAULT 0,
  item_lista_servico text NOT NULL,
  codigo_tributacao_municipio text NOT NULL,
  discriminacao text NOT NULL,
  codigo_municipio text,
  codigo_cnae text,
  exigibilidade_iss integer DEFAULT 1,
  numero_processo text,
  xml_envio text,
  xml_retorno text,
  mensagem_erro text,
  link_nfse text,
  emitida_por uuid REFERENCES auth.users(id),
  cancelada_em timestamp with time zone,
  cancelada_por uuid REFERENCES auth.users(id),
  motivo_cancelamento text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nfse_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_emitidas ENABLE ROW LEVEL SECURITY;

-- Policies para nfse_config
CREATE POLICY "Admins podem ver configurações"
ON public.nfse_config FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem inserir configurações"
ON public.nfse_config FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar configurações"
ON public.nfse_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para nfse_emitidas
CREATE POLICY "Admins e colaboradores podem ver NFS-e"
ON public.nfse_emitidas FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'colaborador'::app_role)
);

CREATE POLICY "Admins e colaboradores podem emitir NFS-e"
ON public.nfse_emitidas FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'colaborador'::app_role)
);

CREATE POLICY "Admins e colaboradores podem atualizar NFS-e"
ON public.nfse_emitidas FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'colaborador'::app_role)
);

-- Clientes podem ver suas próprias notas
CREATE POLICY "Clientes podem ver próprias NFS-e"
ON public.nfse_emitidas FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_nfse_config_updated_at
BEFORE UPDATE ON public.nfse_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfse_emitidas_updated_at
BEFORE UPDATE ON public.nfse_emitidas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Sequence para número de RPS
CREATE SEQUENCE public.nfse_rps_sequence START 1;