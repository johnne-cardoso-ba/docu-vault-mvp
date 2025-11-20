import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Search, Calendar, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { NFSeConfigCard } from "@/components/nfse/NFSeConfigCard";

export default function NFSe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<any[]>([]);
  const [filteredNotas, setFilteredNotas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [configs, setConfigs] = useState<any[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<any[]>([]);
  const [configSearchTerm, setConfigSearchTerm] = useState("");

  useEffect(() => {
    loadNotas();
    loadConfigs();
  }, []);

  useEffect(() => {
    filterNotas();
  }, [searchTerm, startDate, endDate, notas]);

  useEffect(() => {
    filterConfigs();
  }, [configSearchTerm, configs]);

  const loadNotas = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("nfse_config")
        .select(`
          *,
          clients:client_id (
            nome_razao_social,
            cnpj_cpf
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações de NFS-e");
    }
  };

  const filterConfigs = () => {
    if (!configSearchTerm) {
      setFilteredConfigs(configs);
      return;
    }

    const term = configSearchTerm.toLowerCase();
    const filtered = configs.filter(
      (config) =>
        config.clients?.nome_razao_social?.toLowerCase().includes(term) ||
        config.inscricao_municipal?.toLowerCase().includes(term)
    );
    setFilteredConfigs(filtered);
  };

  const filterNotas = () => {
    let filtered = [...notas];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (nota) =>
          nota.numero_nota?.toString().includes(term) ||
          nota.numero_rps?.toString().includes(term) ||
          nota.discriminacao?.toLowerCase().includes(term) ||
          nota.clients?.nome_razao_social?.toLowerCase().includes(term) ||
          nota.tomador_razao_social?.toLowerCase().includes(term)
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (nota) => new Date(nota.data_emissao) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (nota) => new Date(nota.data_emissao) <= new Date(endDate)
      );
    }

    setFilteredNotas(filtered);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: any }> = {
      processando: { label: "Processando", variant: "secondary" },
      emitida: { label: "Emitida", variant: "default" },
      erro: { label: "Erro", variant: "destructive" },
      cancelada: { label: "Cancelada", variant: "outline" },
    };

    const config = configs[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">NFS-e</h2>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie todas as notas fiscais e configurações dos clientes
          </p>
        </div>

        <Tabs defaultValue="notas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notas">Todas as Notas</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações de Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="notas" className="space-y-6 mt-6">

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre as notas fiscais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Número, descrição ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Final</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Tomador</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma nota fiscal encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNotas.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-medium">
                            {nota.numero_nota || `RPS ${nota.numero_rps}`}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {nota.clients?.nome_razao_social || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {nota.clients?.cnpj_cpf}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(nota.data_emissao), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{nota.tomador_razao_social}</p>
                              <p className="text-xs text-muted-foreground">
                                {nota.tomador_cnpj_cpf}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(nota.valor_servicos)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(nota.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de NFS-e dos Clientes</CardTitle>
                <CardDescription>
                  Gerencie as configurações de emissão de NFS-e para cada cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente ou inscrição municipal..."
                      value={configSearchTerm}
                      onChange={(e) => setConfigSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredConfigs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma configuração encontrada
                    </div>
                  ) : (
                    filteredConfigs.map((config) => (
                      <NFSeConfigCard
                        key={config.id}
                        config={config}
                        clientName={config.clients?.nome_razao_social || "Cliente não identificado"}
                        isAdmin={true}
                        onView={() => {}}
                        onEdit={() => navigate(`/nfse/cliente/config`)}
                        onViewXML={() => {}}
                        onDownloadPDF={() => {}}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
