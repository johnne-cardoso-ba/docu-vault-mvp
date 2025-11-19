import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, FileKey } from "lucide-react";

export default function NFSeConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [config, setConfig] = useState({
    inscricao_municipal: "",
    certificado_a1: "",
    senha_certificado: "",
    codigo_tributacao_municipio: "",
    aliquota_iss: "5.00",
    item_lista_servico: "",
    cnae_fiscal: "",
    descricao_servico: "",
    ambiente: "homologacao"
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("nfse_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setConfig({
          inscricao_municipal: data.inscricao_municipal,
          certificado_a1: "", // Não mostrar o certificado por segurança
          senha_certificado: "", // Não mostrar a senha por segurança
          codigo_tributacao_municipio: data.codigo_tributacao_municipio,
          aliquota_iss: data.aliquota_iss.toString(),
          item_lista_servico: data.item_lista_servico,
          cnae_fiscal: data.cnae_fiscal,
          descricao_servico: data.descricao_servico,
          ambiente: data.ambiente
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoadingData(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig(prev => ({ ...prev, certificado_a1: base64.split(',')[1] }));
      toast.success("Certificado carregado com sucesso");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validações
      if (!config.inscricao_municipal || !config.codigo_tributacao_municipio) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      // Verificar se já existe configuração
      const { data: existing } = await supabase
        .from("nfse_config")
        .select("id")
        .single();

      const payload = {
        inscricao_municipal: config.inscricao_municipal,
        codigo_tributacao_municipio: config.codigo_tributacao_municipio,
        aliquota_iss: parseFloat(config.aliquota_iss),
        item_lista_servico: config.item_lista_servico,
        cnae_fiscal: config.cnae_fiscal,
        descricao_servico: config.descricao_servico,
        ambiente: config.ambiente,
        ...(config.certificado_a1 && { certificado_a1: config.certificado_a1 }),
        ...(config.senha_certificado && { senha_certificado: config.senha_certificado })
      };

      if (existing) {
        const { error } = await supabase
          .from("nfse_config")
          .update(payload)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        if (!config.certificado_a1 || !config.senha_certificado) {
          toast.error("Certificado e senha são obrigatórios na primeira configuração");
          return;
        }

        const { error } = await supabase
          .from("nfse_config")
          .insert([payload]);

        if (error) throw error;
      }

      toast.success("Configurações salvas com sucesso");
    } catch (error: any) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuração NFS-e</h1>
        <p className="text-muted-foreground">Configure os dados para emissão de NFS-e em Salvador/BA</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
          <CardDescription>Informações necessárias para emissão de notas fiscais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricao">Inscrição Municipal *</Label>
              <Input
                id="inscricao"
                value={config.inscricao_municipal}
                onChange={(e) => setConfig(prev => ({ ...prev, inscricao_municipal: e.target.value }))}
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_tributacao">Código de Tributação *</Label>
              <Input
                id="codigo_tributacao"
                value={config.codigo_tributacao_municipio}
                onChange={(e) => setConfig(prev => ({ ...prev, codigo_tributacao_municipio: e.target.value }))}
                placeholder="0107010301"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliquota">Alíquota ISS (%) *</Label>
              <Input
                id="aliquota"
                type="number"
                step="0.01"
                value={config.aliquota_iss}
                onChange={(e) => setConfig(prev => ({ ...prev, aliquota_iss: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_lista">Item Lista de Serviço *</Label>
              <Input
                id="item_lista"
                value={config.item_lista_servico}
                onChange={(e) => setConfig(prev => ({ ...prev, item_lista_servico: e.target.value }))}
                placeholder="01.07"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE Fiscal *</Label>
              <Input
                id="cnae"
                value={config.cnae_fiscal}
                onChange={(e) => setConfig(prev => ({ ...prev, cnae_fiscal: e.target.value }))}
                placeholder="6920602"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambiente">Ambiente *</Label>
              <Select value={config.ambiente} onValueChange={(value) => setConfig(prev => ({ ...prev, ambiente: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição Padrão do Serviço *</Label>
            <Textarea
              id="descricao"
              value={config.descricao_servico}
              onChange={(e) => setConfig(prev => ({ ...prev, descricao_servico: e.target.value }))}
              placeholder="Serviços de contabilidade..."
              rows={3}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileKey className="h-5 w-5" />
              Certificado Digital A1
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificado">Arquivo do Certificado (.pfx ou .p12)</Label>
                <Input
                  id="certificado"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground">
                  {config.certificado_a1 ? "Certificado carregado ✓" : "Nenhum certificado carregado"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha do Certificado</Label>
                <Input
                  id="senha"
                  type="password"
                  value={config.senha_certificado}
                  onChange={(e) => setConfig(prev => ({ ...prev, senha_certificado: e.target.value }))}
                  placeholder="Digite a senha do certificado"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/nfse")}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}