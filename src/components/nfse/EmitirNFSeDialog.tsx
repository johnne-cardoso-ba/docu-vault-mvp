import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import InputMask from "react-input-mask";

interface EmitirNFSeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  clientId?: string;
}

export function EmitirNFSeDialog({ open, onOpenChange, onSuccess, clientId }: EmitirNFSeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    tomador_cnpj_cpf: "",
    tomador_razao_social: "",
    tomador_email: "",
    tomador_telefone: "",
    tomador_endereco: "",
    tomador_numero: "",
    tomador_complemento: "",
    tomador_bairro: "",
    tomador_cidade: "",
    tomador_uf: "",
    tomador_cep: "",
    valor_servicos: "",
    discriminacao: "",
    iss_retido: false,
    valor_deducoes: "0",
    valor_pis: "0",
    valor_cofins: "0",
    valor_inss: "0",
    valor_ir: "0",
    valor_csll: "0",
  });

  useEffect(() => {
    if (open && clientId) {
      loadConfig();
    }
  }, [open, clientId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("nfse_config")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Configure sua NFS-e antes de emitir notas");
        onOpenChange(false);
        return;
      }

      setConfig(data);
    } catch (error: any) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configuração");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config) {
      toast.error("Configuração não encontrada");
      return;
    }

    setLoading(true);

    try {
      const valorServicos = parseFloat(formData.valor_servicos);
      const valorDeducoes = parseFloat(formData.valor_deducoes);
      const baseCalculo = valorServicos - valorDeducoes;
      const valorIss = baseCalculo * (config.aliquota_iss / 100);
      const valorLiquido = valorServicos - valorIss - 
        parseFloat(formData.valor_pis) - 
        parseFloat(formData.valor_cofins) - 
        parseFloat(formData.valor_inss) - 
        parseFloat(formData.valor_ir) - 
        parseFloat(formData.valor_csll);

      // Buscar próximo número de RPS
      const { data: nextRps } = await supabase.rpc("get_next_rps");

      const nfseData = {
        client_id: clientId,
        numero_rps: nextRps,
        serie_rps: "RPS",
        tipo_rps: 1,
        valor_servicos: valorServicos,
        valor_deducoes: valorDeducoes,
        base_calculo: baseCalculo,
        aliquota: config.aliquota_iss,
        valor_iss: valorIss,
        valor_liquido_nfse: valorLiquido,
        iss_retido: formData.iss_retido,
        valor_pis: parseFloat(formData.valor_pis),
        valor_cofins: parseFloat(formData.valor_cofins),
        valor_inss: parseFloat(formData.valor_inss),
        valor_ir: parseFloat(formData.valor_ir),
        valor_csll: parseFloat(formData.valor_csll),
        item_lista_servico: config.item_lista_servico,
        codigo_tributacao_municipio: config.codigo_tributacao_municipio,
        discriminacao: formData.discriminacao,
        tomador_cnpj_cpf: formData.tomador_cnpj_cpf.replace(/\D/g, ''),
        tomador_razao_social: formData.tomador_razao_social,
        tomador_email: formData.tomador_email || null,
        tomador_telefone: formData.tomador_telefone || null,
        tomador_endereco: formData.tomador_endereco || null,
        tomador_numero: formData.tomador_numero || null,
        tomador_complemento: formData.tomador_complemento || null,
        tomador_bairro: formData.tomador_bairro || null,
        tomador_cidade: formData.tomador_cidade || null,
        tomador_uf: formData.tomador_uf || null,
        tomador_cep: formData.tomador_cep ? formData.tomador_cep.replace(/\D/g, '') : null,
      };

      // Inserir nota no banco
      const { data: nota, error: insertError } = await supabase
        .from("nfse_emitidas")
        .insert(nfseData)
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("NFS-e criada! Processando emissão...");

      // Chamar edge function para emitir
      const { error: emitError } = await supabase.functions.invoke("emitir-nfse", {
        body: { nfse_id: nota.id },
      });

      if (emitError) {
        console.error("Erro ao emitir:", emitError);
        toast.error("Erro ao processar emissão. Verifique o status da nota.");
      } else {
        toast.success("NFS-e enviada para emissão!");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao emitir NFS-e:", error);
      toast.error(error.message || "Erro ao emitir NFS-e");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tomador_cnpj_cpf: "",
      tomador_razao_social: "",
      tomador_email: "",
      tomador_telefone: "",
      tomador_endereco: "",
      tomador_numero: "",
      tomador_complemento: "",
      tomador_bairro: "",
      tomador_cidade: "",
      tomador_uf: "",
      tomador_cep: "",
      valor_servicos: "",
      discriminacao: "",
      iss_retido: false,
      valor_deducoes: "0",
      valor_pis: "0",
      valor_cofins: "0",
      valor_inss: "0",
      valor_ir: "0",
      valor_csll: "0",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emitir NFS-e</DialogTitle>
          <DialogDescription>
            Preencha os dados do tomador e do serviço prestado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Tomador */}
          <div>
            <h3 className="font-semibold mb-3">Dados do Tomador</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tomador_cnpj_cpf">CPF/CNPJ *</Label>
                <InputMask
                  mask={formData.tomador_cnpj_cpf.length <= 14 ? "999.999.999-99" : "99.999.999/9999-99"}
                  value={formData.tomador_cnpj_cpf}
                  onChange={(e) => setFormData({ ...formData, tomador_cnpj_cpf: e.target.value })}
                >
                  {(inputProps: any) => (
                    <Input {...inputProps} id="tomador_cnpj_cpf" required />
                  )}
                </InputMask>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_razao_social">Razão Social / Nome *</Label>
                <Input
                  id="tomador_razao_social"
                  value={formData.tomador_razao_social}
                  onChange={(e) => setFormData({ ...formData, tomador_razao_social: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_email">Email</Label>
                <Input
                  id="tomador_email"
                  type="email"
                  value={formData.tomador_email}
                  onChange={(e) => setFormData({ ...formData, tomador_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_telefone">Telefone</Label>
                <InputMask
                  mask="(99) 99999-9999"
                  value={formData.tomador_telefone}
                  onChange={(e) => setFormData({ ...formData, tomador_telefone: e.target.value })}
                >
                  {(inputProps: any) => (
                    <Input {...inputProps} id="tomador_telefone" />
                  )}
                </InputMask>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_cep">CEP</Label>
                <InputMask
                  mask="99999-999"
                  value={formData.tomador_cep}
                  onChange={(e) => setFormData({ ...formData, tomador_cep: e.target.value })}
                >
                  {(inputProps: any) => (
                    <Input {...inputProps} id="tomador_cep" />
                  )}
                </InputMask>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_endereco">Endereço</Label>
                <Input
                  id="tomador_endereco"
                  value={formData.tomador_endereco}
                  onChange={(e) => setFormData({ ...formData, tomador_endereco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_numero">Número</Label>
                <Input
                  id="tomador_numero"
                  value={formData.tomador_numero}
                  onChange={(e) => setFormData({ ...formData, tomador_numero: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_bairro">Bairro</Label>
                <Input
                  id="tomador_bairro"
                  value={formData.tomador_bairro}
                  onChange={(e) => setFormData({ ...formData, tomador_bairro: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_cidade">Cidade</Label>
                <Input
                  id="tomador_cidade"
                  value={formData.tomador_cidade}
                  onChange={(e) => setFormData({ ...formData, tomador_cidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomador_uf">UF</Label>
                <Input
                  id="tomador_uf"
                  value={formData.tomador_uf}
                  onChange={(e) => setFormData({ ...formData, tomador_uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Dados do Serviço */}
          <div>
            <h3 className="font-semibold mb-3">Dados do Serviço</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discriminacao">Discriminação do Serviço *</Label>
                <Textarea
                  id="discriminacao"
                  value={formData.discriminacao}
                  onChange={(e) => setFormData({ ...formData, discriminacao: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_servicos">Valor dos Serviços (R$) *</Label>
                  <Input
                    id="valor_servicos"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_servicos}
                    onChange={(e) => setFormData({ ...formData, valor_servicos: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_deducoes">Deduções (R$)</Label>
                  <Input
                    id="valor_deducoes"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_deducoes}
                    onChange={(e) => setFormData({ ...formData, valor_deducoes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="iss_retido"
                  checked={formData.iss_retido}
                  onCheckedChange={(checked) => setFormData({ ...formData, iss_retido: checked as boolean })}
                />
                <Label htmlFor="iss_retido" className="cursor-pointer">
                  ISS Retido
                </Label>
              </div>

              <details className="border rounded-lg p-4">
                <summary className="cursor-pointer font-medium">Retenções (opcional)</summary>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_pis">PIS (R$)</Label>
                    <Input
                      id="valor_pis"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_pis}
                      onChange={(e) => setFormData({ ...formData, valor_pis: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_cofins">COFINS (R$)</Label>
                    <Input
                      id="valor_cofins"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_cofins}
                      onChange={(e) => setFormData({ ...formData, valor_cofins: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_inss">INSS (R$)</Label>
                    <Input
                      id="valor_inss"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_inss}
                      onChange={(e) => setFormData({ ...formData, valor_inss: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_ir">IR (R$)</Label>
                    <Input
                      id="valor_ir"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_ir}
                      onChange={(e) => setFormData({ ...formData, valor_ir: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_csll">CSLL (R$)</Label>
                    <Input
                      id="valor_csll"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_csll}
                      onChange={(e) => setFormData({ ...formData, valor_csll: e.target.value })}
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Emitir NFS-e
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
