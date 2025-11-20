import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Search, FileText, Download } from "lucide-react";
import { NFSeConfigCard } from "@/components/nfse/NFSeConfigCard";

export default function AdminNFSeConfigs() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    filterConfigs();
  }, [searchTerm, configs]);

  const loadConfigs = async () => {
    try {
      setLoading(true);

      const { data: configsData, error } = await supabase
        .from("nfse_config")
        .select(`
          *,
          clients:client_id (
            id,
            nome_razao_social,
            cnpj,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const configsWithClient = configsData?.map((config: any) => ({
        ...config,
        client: Array.isArray(config.clients) ? config.clients[0] : config.clients,
      })) || [];

      setConfigs(configsWithClient);
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const filterConfigs = () => {
    let filtered = [...configs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (config) =>
          config.client?.nome_razao_social?.toLowerCase().includes(term) ||
          config.client?.cnpj?.includes(searchTerm) ||
          config.inscricao_municipal?.includes(searchTerm) ||
          config.cnae_fiscal?.includes(searchTerm)
      );
    }

    setFilteredConfigs(filtered);
  };

  const handleViewXML = async (config: any) => {
    // Buscar última nota emitida do cliente para obter XML
    try {
      const { data, error } = await supabase
        .from("nfse_emitidas")
        .select("xml_envio, numero_nota, numero_rps")
        .eq("client_id", config.client_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.xml_envio) {
        toast.error("Nenhuma nota emitida encontrada para este cliente");
        return;
      }

      const blob = new Blob([data.xml_envio], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nfse-${data.numero_nota || data.numero_rps}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("XML baixado com sucesso");
    } catch (error: any) {
      console.error("Erro ao buscar XML:", error);
      toast.error("Erro ao buscar XML");
    }
  };

  const handleDownloadPDF = (config: any) => {
    toast.info("Funcionalidade de PDF em desenvolvimento");
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
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">
            Configurações de NFS-e dos Clientes
          </h2>
          <p className="text-muted-foreground mt-2">
            Gerencie todas as configurações de NFS-e dos clientes
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, IM ou CNAE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {filteredConfigs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchTerm
                    ? "Nenhuma configuração encontrada"
                    : "Nenhuma configuração cadastrada"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConfigs.map((config) => (
              <NFSeConfigCard
                key={config.id}
                config={config}
                clientName={config.client?.nome_razao_social || "Cliente sem nome"}
                onView={() => {
                  setSelectedConfig(config);
                  setViewDialogOpen(true);
                }}
                onEdit={() => toast.info("Edição em desenvolvimento")}
                onViewXML={() => handleViewXML(config)}
                onDownloadPDF={() => handleDownloadPDF(config)}
                isAdmin={true}
              />
            ))}
          </div>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Configuração</DialogTitle>
            </DialogHeader>
            {selectedConfig && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Cliente</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Nome:</strong> {selectedConfig.client?.nome_razao_social}</p>
                    <p><strong>CNPJ:</strong> {selectedConfig.client?.cnpj}</p>
                    <p><strong>Email:</strong> {selectedConfig.client?.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Configuração Fiscal</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Inscrição Municipal:</p>
                      <p className="font-medium">{selectedConfig.inscricao_municipal}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNAE Fiscal:</p>
                      <p className="font-medium">{selectedConfig.cnae_fiscal}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Código de Tributação:</p>
                      <p className="font-medium">{selectedConfig.codigo_tributacao_municipio}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Item Lista de Serviço:</p>
                      <p className="font-medium">{selectedConfig.item_lista_servico}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Alíquota ISS:</p>
                      <p className="font-medium">{selectedConfig.aliquota_iss}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ambiente:</p>
                      <p className="font-medium capitalize">{selectedConfig.ambiente}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Descrição do Serviço</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedConfig.descricao_servico}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Certificado Digital</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConfig.certificado_a1 ? "✓ Certificado configurado" : "✗ Sem certificado"}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
