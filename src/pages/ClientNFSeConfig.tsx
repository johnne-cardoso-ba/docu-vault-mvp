import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import InputMask from "react-input-mask";
import { CertificateUpload } from "@/components/nfse/CertificateUpload";
import { NFSePreview } from "@/components/nfse/NFSePreview";

export default function ClientNFSeConfig() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    inscricao_municipal: "",
    cnae_fiscal: "",
    codigo_tributacao_municipio: "",
    item_lista_servico: "",
    descricao_servico: "",
    aliquota_iss: "5.00",
    ambiente: "homologacao",
    certificado_a1: "",
    senha_certificado: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (!profileData) return;

      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("email", profileData.email)
        .single();

      if (!client) {
        toast.error("Cliente não encontrado");
        return;
      }

      setClientData(client);

      const { data: config } = await supabase
        .from("nfse_config")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle();

      if (config) {
        setConfigId(config.id);
        setFormData({
          inscricao_municipal: config.inscricao_municipal || client.inscricao_municipal || "",
          cnae_fiscal: config.cnae_fiscal || "",
          codigo_tributacao_municipio: config.codigo_tributacao_municipio || "",
          item_lista_servico: config.item_lista_servico || "",
          descricao_servico: config.descricao_servico || client.atividade_principal || "",
          aliquota_iss: config.aliquota_iss?.toString() || "5.00",
          ambiente: config.ambiente || "homologacao",
          certificado_a1: config.certificado_a1 || "",
          senha_certificado: "",
        });
      } else {
        setFormData(prev => ({
          ...prev,
          inscricao_municipal: client.inscricao_municipal || "",
          descricao_servico: client.atividade_principal || "",
        }));
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientData) {
      toast.error("Dados do cliente não encontrados");
      return;
    }

    if (!formData.certificado_a1 && !configId) {
      toast.error("Por favor, faça upload do certificado digital");
      return;
    }

    setSaving(true);

    try {
      const configData: any = {
        client_id: clientData.id,
        inscricao_municipal: formData.inscricao_municipal,
        cnae_fiscal: formData.cnae_fiscal.replace(/\D/g, ''),
        codigo_tributacao_municipio: formData.codigo_tributacao_municipio,
        item_lista_servico: formData.item_lista_servico,
        descricao_servico: formData.descricao_servico,
        aliquota_iss: parseFloat(formData.aliquota_iss),
        ambiente: formData.ambiente,
      };

      if (formData.certificado_a1) {
        configData.certificado_a1 = formData.certificado_a1;
      }

      if (formData.senha_certificado) {
        configData.senha_certificado = formData.senha_certificado;
      }

      if (configId) {
        const { error } = await supabase
          .from("nfse_config")
          .update(configData)
          .eq("id", configId);

        if (error) throw error;
        toast.success("Configuração atualizada com sucesso!");
      } else {
        if (!formData.senha_certificado) {
          toast.error("Senha do certificado é obrigatória");
          setSaving(false);
          return;
        }
        
        configData.senha_certificado = formData.senha_certificado;

        const { data, error } = await supabase
          .from("nfse_config")
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        setConfigId(data.id);
        toast.success("Configuração criada com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Configuração de NFS-e</h2>
          <p className="text-muted-foreground mt-2">
            Configure os dados necessários para emissão de suas notas fiscais eletrônicas
          </p>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="preview" disabled={!configId && !formData.cnae_fiscal}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Configuração</CardTitle>
                <CardDescription>
                  Preencha todos os campos obrigatórios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inscricao_municipal">Inscrição Municipal *</Label>
                      <Input
                        id="inscricao_municipal"
                        value={formData.inscricao_municipal}
                        onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                        placeholder="000000000"
                        maxLength={20}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnae_fiscal">CNAE Fiscal *</Label>
                      <InputMask
                        mask="9999-9/99"
                        value={formData.cnae_fiscal}
                        onChange={(e) => setFormData({ ...formData, cnae_fiscal: e.target.value })}
                      >
                        {(inputProps: any) => (
                          <Input
                            {...inputProps}
                            id="cnae_fiscal"
                            placeholder="0000-0/00"
                            required
                          />
                        )}
                      </InputMask>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo_tributacao_municipio">Código de Tributação *</Label>
                      <Input
                        id="codigo_tributacao_municipio"
                        value={formData.codigo_tributacao_municipio}
                        onChange={(e) => setFormData({ ...formData, codigo_tributacao_municipio: e.target.value })}
                        placeholder="0000000000"
                        maxLength={20}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item_lista_servico">Item Lista de Serviço *</Label>
                      <InputMask
                        mask="99.99"
                        value={formData.item_lista_servico}
                        onChange={(e) => setFormData({ ...formData, item_lista_servico: e.target.value })}
                      >
                        {(inputProps: any) => (
                          <Input
                            {...inputProps}
                            id="item_lista_servico"
                            placeholder="00.00"
                            required
                          />
                        )}
                      </InputMask>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aliquota_iss">Alíquota ISS (%) *</Label>
                      <Input
                        id="aliquota_iss"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.aliquota_iss}
                        onChange={(e) => setFormData({ ...formData, aliquota_iss: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ambiente">Ambiente *</Label>
                      <Select
                        value={formData.ambiente}
                        onValueChange={(value) => setFormData({ ...formData, ambiente: value })}
                      >
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
                    <Label htmlFor="descricao_servico">Descrição do Serviço *</Label>
                    <Textarea
                      id="descricao_servico"
                      value={formData.descricao_servico}
                      onChange={(e) => setFormData({ ...formData, descricao_servico: e.target.value })}
                      rows={3}
                      maxLength={2000}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.descricao_servico.length}/2000 caracteres
                    </p>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">Certificado Digital A1</h3>
                    
                    <CertificateUpload
                      onCertificateConverted={(base64) => setFormData({ ...formData, certificado_a1: base64 })}
                      currentCertificate={formData.certificado_a1}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="senha_certificado">
                        Senha do Certificado {configId && "(deixe em branco para não alterar)"}
                      </Label>
                      <Input
                        id="senha_certificado"
                        type="password"
                        value={formData.senha_certificado}
                        onChange={(e) => setFormData({ ...formData, senha_certificado: e.target.value })}
                        required={!configId}
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {configId ? "Atualizar Configuração" : "Salvar Configuração"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <NFSePreview config={formData} clientData={clientData} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
