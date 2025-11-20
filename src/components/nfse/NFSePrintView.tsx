import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo-escritura.png";

interface NFSePrintViewProps {
  nota: any;
  prestador?: any;
}

export function NFSePrintView({ nota, prestador }: NFSePrintViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="p-8 bg-white text-black max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <img src={logo} alt="Logo" className="h-12 mx-auto mb-2" />
        <h1 className="text-2xl font-bold">NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e</h1>
        <p className="text-sm">
          Nº {nota.numero_nota || "Processando"} - Série {nota.serie_rps}
        </p>
      </div>

      {/* Dados da Nota */}
      <div className="mb-4">
        <h2 className="font-bold text-lg mb-2 border-b border-gray-300">DADOS DA NOTA</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">Número RPS:</span>
            <p>{nota.numero_rps}</p>
          </div>
          <div>
            <span className="font-semibold">Data Emissão:</span>
            <p>{format(new Date(nota.data_emissao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          </div>
          <div>
            <span className="font-semibold">Código Verificação:</span>
            <p>{nota.codigo_verificacao || "N/A"}</p>
          </div>
          <div>
            <span className="font-semibold">Status:</span>
            <p className="uppercase">{nota.status}</p>
          </div>
        </div>
      </div>

      {/* Prestador */}
      <div className="mb-4">
        <h2 className="font-bold text-lg mb-2 border-b border-gray-300">PRESTADOR DE SERVIÇOS</h2>
        <div className="text-sm">
          <p className="font-semibold">{prestador?.nome_razao_social || "Nome do Prestador"}</p>
          <p>CNPJ: {prestador?.cnpj || nota.tomador_cnpj_cpf}</p>
          <p>Inscrição Municipal: {prestador?.inscricao_municipal || "N/A"}</p>
          {prestador?.logradouro && (
            <p>
              {prestador.logradouro}, {prestador.numero} - {prestador.bairro}
            </p>
          )}
          {prestador?.cidade && (
            <p>
              {prestador.cidade} - {prestador.estado} - CEP: {prestador.cep}
            </p>
          )}
        </div>
      </div>

      {/* Tomador */}
      <div className="mb-4">
        <h2 className="font-bold text-lg mb-2 border-b border-gray-300">TOMADOR DE SERVIÇOS</h2>
        <div className="text-sm">
          <p className="font-semibold">{nota.tomador_razao_social}</p>
          <p>CPF/CNPJ: {nota.tomador_cnpj_cpf}</p>
          {nota.tomador_endereco && (
            <>
              <p>
                {nota.tomador_endereco}, {nota.tomador_numero} - {nota.tomador_bairro}
              </p>
              <p>
                {nota.tomador_cidade} - {nota.tomador_uf} - CEP: {nota.tomador_cep}
              </p>
            </>
          )}
          {nota.tomador_email && <p>Email: {nota.tomador_email}</p>}
          {nota.tomador_telefone && <p>Telefone: {nota.tomador_telefone}</p>}
        </div>
      </div>

      {/* Discriminação do Serviço */}
      <div className="mb-4">
        <h2 className="font-bold text-lg mb-2 border-b border-gray-300">
          DISCRIMINAÇÃO DOS SERVIÇOS
        </h2>
        <div className="text-sm whitespace-pre-wrap">
          <p>{nota.discriminacao}</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Item Lista de Serviço:</span> {nota.item_lista_servico}
          </div>
          <div>
            <span className="font-semibold">Código CNAE:</span> {nota.codigo_cnae || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Código Tributação:</span>{" "}
            {nota.codigo_tributacao_municipio}
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="mb-4">
        <h2 className="font-bold text-lg mb-2 border-b border-gray-300">VALORES</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-1">Valor dos Serviços:</td>
              <td className="text-right py-1">{formatCurrency(nota.valor_servicos)}</td>
            </tr>
            {nota.valor_deducoes > 0 && (
              <tr className="border-b">
                <td className="py-1">(-) Deduções:</td>
                <td className="text-right py-1">{formatCurrency(nota.valor_deducoes)}</td>
              </tr>
            )}
            <tr className="border-b">
              <td className="py-1">Base de Cálculo:</td>
              <td className="text-right py-1">{formatCurrency(nota.base_calculo)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1">Alíquota ISS:</td>
              <td className="text-right py-1">{nota.aliquota}%</td>
            </tr>
            <tr className="border-b">
              <td className="py-1">Valor ISS:</td>
              <td className="text-right py-1">{formatCurrency(nota.valor_iss || 0)}</td>
            </tr>
            {nota.valor_pis > 0 && (
              <tr className="border-b">
                <td className="py-1">(-) PIS:</td>
                <td className="text-right py-1">{formatCurrency(nota.valor_pis)}</td>
              </tr>
            )}
            {nota.valor_cofins > 0 && (
              <tr className="border-b">
                <td className="py-1">(-) COFINS:</td>
                <td className="text-right py-1">{formatCurrency(nota.valor_cofins)}</td>
              </tr>
            )}
            {nota.valor_inss > 0 && (
              <tr className="border-b">
                <td className="py-1">(-) INSS:</td>
                <td className="text-right py-1">{formatCurrency(nota.valor_inss)}</td>
              </tr>
            )}
            {nota.valor_ir > 0 && (
              <tr className="border-b">
                <td className="py-1">(-) IR:</td>
                <td className="text-right py-1">{formatCurrency(nota.valor_ir)}</td>
              </tr>
            )}
            {nota.valor_csll > 0 && (
              <tr className="border-b">
                <td className="py-1">(-) CSLL:</td>
                <td className="text-right py-1">{formatCurrency(nota.valor_csll)}</td>
              </tr>
            )}
            <tr className="font-bold text-base border-t-2 border-black">
              <td className="py-2">VALOR LÍQUIDO:</td>
              <td className="text-right py-2">{formatCurrency(nota.valor_liquido_nfse)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Observações */}
      {nota.mensagem_erro && (
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-2 border-b border-gray-300">OBSERVAÇÕES</h2>
          <p className="text-sm text-red-600">{nota.mensagem_erro}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-black text-xs text-center text-gray-600">
        <p>Esta nota foi emitida eletronicamente e possui validade jurídica.</p>
        {nota.link_nfse && (
          <p className="mt-2">
            Consulte a autenticidade em: <a href={nota.link_nfse} className="text-blue-600">{nota.link_nfse}</a>
          </p>
        )}
      </div>
    </div>
  );
}
