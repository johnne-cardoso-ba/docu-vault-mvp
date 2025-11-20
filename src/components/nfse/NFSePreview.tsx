import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NFSePreviewProps {
  config: any;
  clientData?: any;
}

export function NFSePreview({ config, clientData }: NFSePreviewProps) {
  const simulateNFSe = () => {
    const valorServico = 1000.00;
    const valorISS = valorServico * (parseFloat(config.aliquota_iss) / 100);
    const valorLiquido = valorServico - valorISS;

    return {
      numero_rps: "001",
      serie_rps: "RPS",
      valor_servicos: valorServico,
      valor_iss: valorISS,
      valor_liquido: valorLiquido,
      base_calculo: valorServico,
    };
  };

  const nfse = simulateNFSe();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Preview da NFS-e</CardTitle>
            <CardDescription>
              Simulação de emissão com as configurações atuais
            </CardDescription>
          </div>
          <Badge variant={config.ambiente === "producao" ? "default" : "secondary"}>
            {config.ambiente === "producao" ? "Produção" : "Homologação"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">RPS:</span>
            <p className="font-medium">{nfse.numero_rps}/{nfse.serie_rps}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Inscrição Municipal:</span>
            <p className="font-medium">{config.inscricao_municipal}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Prestador</h4>
          <div className="text-sm space-y-1">
            <p>{clientData?.nome_razao_social || "Nome do Prestador"}</p>
            <p className="text-muted-foreground">
              CNPJ: {clientData?.cnpj || "00.000.000/0000-00"}
            </p>
            <p className="text-muted-foreground">
              IM: {config.inscricao_municipal}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Serviço</h4>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">Descrição:</span>
              <p>{config.descricao_servico}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">CNAE:</span>
                <p className="font-medium">{config.cnae_fiscal}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Item Lista:</span>
                <p className="font-medium">{config.item_lista_servico}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cód. Tributação:</span>
                <p className="font-medium">{config.codigo_tributacao_municipio}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Alíquota ISS:</span>
                <p className="font-medium">{config.aliquota_iss}%</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Valores (Simulação)</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor dos Serviços:</span>
              <span className="font-medium">{formatCurrency(nfse.valor_servicos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base de Cálculo:</span>
              <span>{formatCurrency(nfse.base_calculo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor ISS ({config.aliquota_iss}%):</span>
              <span>{formatCurrency(nfse.valor_iss)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Valor Líquido:</span>
              <span>{formatCurrency(nfse.valor_liquido)}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md">
          <p className="text-xs text-muted-foreground">
            Esta é uma simulação com valores fictícios para validar a configuração. 
            Os valores reais serão calculados no momento da emissão.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
