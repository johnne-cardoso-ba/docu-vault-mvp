import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFSeData {
  nfse_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nfse_id }: NFSeData = await req.json();

    console.log('Processando emissão de NFS-e:', nfse_id);

    // Buscar dados da NFS-e
    const { data: nfse, error: nfseError } = await supabaseClient
      .from('nfse_emitidas')
      .select('*')
      .eq('id', nfse_id)
      .single();

    if (nfseError) throw nfseError;

    // Buscar configuração
    const { data: config, error: configError } = await supabaseClient
      .from('nfse_config')
      .select('*')
      .single();

    if (configError) throw configError;

    // Construir XML do RPS (estrutura básica - precisa ser ajustada conforme webservice da SEFAZ-BA)
    const xmlRps = `<?xml version="1.0" encoding="UTF-8"?>
<GerarNfseEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Rps>
    <InfDeclaracaoPrestacaoServico>
      <Rps>
        <IdentificacaoRps>
          <Numero>${nfse.numero_rps}</Numero>
          <Serie>${nfse.serie_rps}</Serie>
          <Tipo>${nfse.tipo_rps}</Tipo>
        </IdentificacaoRps>
        <DataEmissao>${new Date().toISOString()}</DataEmissao>
        <Status>1</Status>
      </Rps>
      <Servico>
        <Valores>
          <ValorServicos>${nfse.valor_servicos.toFixed(2)}</ValorServicos>
          <ValorDeducoes>${nfse.valor_deducoes.toFixed(2)}</ValorDeducoes>
          <ValorPis>${nfse.valor_pis.toFixed(2)}</ValorPis>
          <ValorCofins>${nfse.valor_cofins.toFixed(2)}</ValorCofins>
          <ValorInss>${nfse.valor_inss.toFixed(2)}</ValorInss>
          <ValorIr>${nfse.valor_ir.toFixed(2)}</ValorIr>
          <ValorCsll>${nfse.valor_csll.toFixed(2)}</ValorCsll>
          <OutrasRetencoes>${nfse.outras_retencoes.toFixed(2)}</OutrasRetencoes>
          <IssRetido>${nfse.iss_retido ? 1 : 2}</IssRetido>
          <ValorIss>${nfse.valor_iss.toFixed(2)}</ValorIss>
          <ValorIssRetido>${nfse.valor_iss_retido.toFixed(2)}</ValorIssRetido>
          <BaseCalculo>${nfse.base_calculo.toFixed(2)}</BaseCalculo>
          <Aliquota>${nfse.aliquota.toFixed(4)}</Aliquota>
          <ValorLiquidoNfse>${nfse.valor_liquido_nfse.toFixed(2)}</ValorLiquidoNfse>
          <DescontoIncondicionado>${nfse.desconto_incondicionado.toFixed(2)}</DescontoIncondicionado>
          <DescontoCondicionado>${nfse.desconto_condicionado.toFixed(2)}</DescontoCondicionado>
        </Valores>
        <ItemListaServico>${nfse.item_lista_servico}</ItemListaServico>
        <CodigoTributacaoMunicipio>${nfse.codigo_tributacao_municipio}</CodigoTributacaoMunicipio>
        <Discriminacao>${nfse.discriminacao}</Discriminacao>
        <CodigoMunicipio>${nfse.codigo_municipio || '2927408'}</CodigoMunicipio>
        <CodigoCnae>${nfse.codigo_cnae}</CodigoCnae>
        <ExigibilidadeISS>${nfse.exigibilidade_iss}</ExigibilidadeISS>
        ${nfse.numero_processo ? `<NumeroProcesso>${nfse.numero_processo}</NumeroProcesso>` : ''}
      </Servico>
      <Prestador>
        <CpfCnpj>
          <Cnpj>${config.inscricao_municipal}</Cnpj>
        </CpfCnpj>
        <InscricaoMunicipal>${config.inscricao_municipal}</InscricaoMunicipal>
      </Prestador>
      <Tomador>
        <IdentificacaoTomador>
          <CpfCnpj>
            ${nfse.tomador_cnpj_cpf.length === 11 
              ? `<Cpf>${nfse.tomador_cnpj_cpf}</Cpf>` 
              : `<Cnpj>${nfse.tomador_cnpj_cpf}</Cnpj>`}
          </CpfCnpj>
        </IdentificacaoTomador>
        <RazaoSocial>${nfse.tomador_razao_social}</RazaoSocial>
        <Endereco>
          <Endereco>${nfse.tomador_endereco}</Endereco>
          <Numero>${nfse.tomador_numero}</Numero>
          ${nfse.tomador_complemento ? `<Complemento>${nfse.tomador_complemento}</Complemento>` : ''}
          <Bairro>${nfse.tomador_bairro}</Bairro>
          <CodigoMunicipio>${nfse.codigo_municipio || '2927408'}</CodigoMunicipio>
          <Uf>${nfse.tomador_uf}</Uf>
          <Cep>${nfse.tomador_cep}</Cep>
        </Endereco>
        ${nfse.tomador_telefone ? `<Contato><Telefone>${nfse.tomador_telefone}</Telefone></Contato>` : ''}
        ${nfse.tomador_email ? `<Contato><Email>${nfse.tomador_email}</Email></Contato>` : ''}
      </Tomador>
    </InfDeclaracaoPrestacaoServico>
  </Rps>
</GerarNfseEnvio>`;

    // Salvar XML de envio
    await supabaseClient
      .from('nfse_emitidas')
      .update({ xml_envio: xmlRps })
      .eq('id', nfse_id);

    console.log('XML do RPS gerado:', xmlRps.substring(0, 200) + '...');

    // IMPORTANTE: Aqui você precisará fazer a integração real com o webservice da SEFAZ-BA
    // Por enquanto, simulando sucesso para testes
    const simulatedResponse = {
      numero_nota: Math.floor(Math.random() * 900000) + 100000,
      codigo_verificacao: Math.random().toString(36).substring(7).toUpperCase(),
      link_nfse: `https://www.sefaz.salvador.ba.gov.br/nfse/consulta/${nfse.numero_rps}`
    };

    // Atualizar NFS-e com dados de retorno
    const { error: updateError } = await supabaseClient
      .from('nfse_emitidas')
      .update({
        status: 'emitida',
        numero_nota: simulatedResponse.numero_nota,
        codigo_verificacao: simulatedResponse.codigo_verificacao,
        link_nfse: simulatedResponse.link_nfse,
        xml_retorno: JSON.stringify(simulatedResponse)
      })
      .eq('id', nfse_id);

    if (updateError) throw updateError;

    console.log('NFS-e emitida com sucesso:', simulatedResponse);

    return new Response(
      JSON.stringify({
        success: true,
        numero_nota: simulatedResponse.numero_nota,
        codigo_verificacao: simulatedResponse.codigo_verificacao,
        link_nfse: simulatedResponse.link_nfse
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Erro ao emitir NFS-e:', error);

    // Atualizar status para erro se houver nfse_id
    try {
      const { nfse_id } = await req.json();
      if (nfse_id) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('nfse_emitidas')
          .update({
            status: 'erro',
            mensagem_erro: error.message
          })
          .eq('id', nfse_id);
      }
    } catch (updateError) {
      console.error('Erro ao atualizar status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});