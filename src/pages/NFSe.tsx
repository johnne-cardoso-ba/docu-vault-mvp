import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, FileText, Settings, Search, Plus, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NFSe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notas, setNotas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [showEmitirDialog, setShowEmitirDialog] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: "",
    valor_servicos: "",
    discriminacao: "",
    iss_retido: false,
    desconto_incondicionado: "0"
  });

  useEffect(() => {
    checkConfig();
    loadNotas();
    loadClientes();
  }, []);

  const checkConfig = async () => {
    const { data } = await supabase
      .from("nfse_config")
      .select("id")
      .single();
    
    setConfigExists(!!data);
  };

  const loadNotas = async () => {
    try {
      const { data, error } = await supabase
        .from("nfse_emitidas")
        .select(`
          *,
          clients:client_id (
            nome_razao_social,
            cnpj_cpf
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar notas:", error);
      toast.error("Erro ao carregar notas fiscais");
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nome_razao_social, cnpj_cpf, email, telefone, logradouro, numero, bairro, cidade, estado, cep")
        .eq("situacao", "Ativo")
        .order("nome_razao_social");

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    }
  };

  const handleEmitir = async () => {
    if (!configExists) {
      toast.error("Configure os dados da NFS-e antes de emitir");
      navigate("/nfse/config");
      return;
    }

    if (!formData.client_id || !formData.valor_servicos || !formData.discriminacao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Buscar dados do cliente selecionado
      const cliente = clientes.find(c => c.id === formData.client_id);
      if (!cliente) throw new Error("Cliente não encontrado");

      // Buscar config
      const { data: config, error: configError } = await supabase
        .from("nfse_config")
        .select("*")
        .single();

      if (configError) throw configError;

      // Gerar próximo número RPS usando função SQL
      const { data: proximoRpsData, error: rpsError } = await supabase.rpc("get_next_rps");
      
      if (rpsError) throw rpsError;
      const proximoRps = proximoRpsData as number;

      const valorServicos = parseFloat(formData.valor_servicos);
      const desconto = parseFloat(formData.desconto_incondicionado);
      const baseCalculo = valorServicos - desconto;
      const valorIss = baseCalculo * (parseFloat(config.aliquota_iss.toString()) / 100);
      const valorLiquido = baseCalculo - (formData.iss_retido ? valorIss : 0);

      // Inserir NFS-e no banco
      const { data: nfse, error: nfseError } = await supabase
        .from("nfse_emitidas")
        .insert([{
          numero_rps: proximoRps,
          client_id: formData.client_id,
          tomador_cnpj_cpf: cliente.cnpj_cpf,
          tomador_razao_social: cliente.nome_razao_social,
          tomador_endereco: cliente.logradouro,
          tomador_numero: cliente.numero,
          tomador_bairro: cliente.bairro,
          tomador_cidade: cliente.cidade,
          tomador_uf: cliente.estado,
          tomador_cep: cliente.cep,
          tomador_email: cliente.email,
          tomador_telefone: cliente.telefone,
          valor_servicos: valorServicos,
          desconto_incondicionado: desconto,
          base_calculo: baseCalculo,
          aliquota: config.aliquota_iss,
          valor_iss: valorIss,
          iss_retido: formData.iss_retido,
          valor_iss_retido: formData.iss_retido ? valorIss : 0,
          valor_liquido_nfse: valorLiquido,
          item_lista_servico: config.item_lista_servico,
          codigo_tributacao_municipio: config.codigo_tributacao_municipio,
          discriminacao: formData.discriminacao,
          codigo_cnae: config.cnae_fiscal,
          emitida_por: (await supabase.auth.getUser()).data.user?.id,
          status: "processando"
        }])
        .select()
        .single();

      if (nfseError) throw nfseError;

      // Chamar edge function para enviar à SEFAZ
      const { data: result, error: funcError } = await supabase.functions.invoke("emitir-nfse", {
        body: { nfse_id: nfse.id }
      });

      if (funcError) throw funcError;

      toast.success("NFS-e emitida com sucesso!");
      setShowEmitirDialog(false);
      setFormData({
        client_id: "",
        valor_servicos: "",
        discriminacao: "",
        iss_retido: false,
        desconto_incondicionado: "0"
      });
      loadNotas();
    } catch (error: any) {
      console.error("Erro ao emitir NFS-e:", error);
      toast.error(error.message || "Erro ao emitir NFS-e");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      emitida: "default",
      processando: "secondary",
      cancelada: "destructive",
      erro: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">NFS-e - Notas Fiscais</h1>
          <p className="text-muted-foreground">Emita e gerencie suas notas fiscais eletrônicas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/nfse/config")}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          <Dialog open={showEmitirDialog} onOpenChange={setShowEmitirDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Emitir NFS-e
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Emitir Nova NFS-e</DialogTitle>
                <DialogDescription>Preencha os dados para emissão da nota fiscal</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_razao_social} - {cliente.cnpj_cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor dos Serviços (R$) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor_servicos}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_servicos: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desconto">Desconto (R$)</Label>
                    <Input
                      id="desconto"
                      type="number"
                      step="0.01"
                      value={formData.desconto_incondicionado}
                      onChange={(e) => setFormData(prev => ({ ...prev, desconto_incondicionado: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discriminacao">Discriminação dos Serviços *</Label>
                  <Textarea
                    id="discriminacao"
                    value={formData.discriminacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, discriminacao: e.target.value }))}
                    placeholder="Descreva os serviços prestados..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="iss_retido"
                    checked={formData.iss_retido}
                    onChange={(e) => setFormData(prev => ({ ...prev, iss_retido: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="iss_retido" className="cursor-pointer">ISS Retido na Fonte</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEmitirDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleEmitir} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Emitindo...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Emitir NFS-e
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais Emitidas</CardTitle>
          <CardDescription>Histórico de todas as NFS-e emitidas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma nota fiscal emitida ainda
                  </TableCell>
                </TableRow>
              ) : (
                notas.map((nota) => (
                  <TableRow key={nota.id}>
                    <TableCell className="font-medium">
                      {nota.numero_nota || `RPS ${nota.numero_rps}`}
                    </TableCell>
                    <TableCell>
                      {format(new Date(nota.data_emissao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{nota.clients?.nome_razao_social || nota.tomador_razao_social}</TableCell>
                    <TableCell>R$ {nota.valor_liquido_nfse.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(nota.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {nota.link_nfse && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={nota.link_nfse} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}