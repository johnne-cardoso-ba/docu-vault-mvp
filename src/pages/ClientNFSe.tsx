import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, FileText, Download, Search, Calendar, Settings, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NFSePrintView } from "@/components/nfse/NFSePrintView";

export default function ClientNFSe() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<any[]>([]);
  const [filteredNotas, setFilteredNotas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedNota, setSelectedNota] = useState<any>(null);
  const [prestadorData, setPrestadorData] = useState<any>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `NFS-e-${selectedNota?.numero_nota || selectedNota?.numero_rps}`,
  });

  const openPrintDialog = async (nota: any) => {
    setSelectedNota(nota);
    // Buscar dados do prestador
    if (nota.client_id) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", nota.client_id)
        .single();
      setPrestadorData(data);
    }
    setPrintDialogOpen(true);
  };

  useEffect(() => {
    loadNotas();
  }, []);

  useEffect(() => {
    filterNotas();
  }, [searchTerm, startDate, endDate, notas]);

  const loadNotas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("nfse_emitidas")
        .select("*")
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

  const filterNotas = () => {
    let filtered = [...notas];

    if (searchTerm) {
      filtered = filtered.filter(
        (nota) =>
          nota.numero_nota?.toString().includes(searchTerm) ||
          nota.discriminacao?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const statusConfig = {
      emitida: { label: "Emitida", variant: "default" as const },
      processando: { label: "Processando", variant: "secondary" as const },
      erro: { label: "Erro", variant: "destructive" as const },
      cancelada: { label: "Cancelada", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleDownloadXML = (nota: any) => {
    if (!nota.xml_envio) {
      toast.error("XML não disponível para esta nota");
      return;
    }

    const blob = new Blob([nota.xml_envio], { type: "application/xml" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nfse-${nota.numero_nota || nota.numero_rps}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Minhas NFS-e</h2>
            <p className="text-muted-foreground mt-2">
              Visualize suas notas fiscais de serviço eletrônicas
            </p>
          </div>
          <Button 
            onClick={() => navigate("/nfse/cliente/config")}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar NFS-e
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Busque e filtre suas notas fiscais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Número ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Data Inicial
                </label>
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
                <label className="text-sm font-medium mb-2 block">
                  Data Final
                </label>
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
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
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
                            {format(new Date(nota.data_emissao), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {nota.discriminacao}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(nota.valor_servicos)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(nota.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPrintDialog(nota)}
                                title="Imprimir NFS-e"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              {nota.link_nfse && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(nota.link_nfse, "_blank")}
                                  title="Visualizar NFS-e"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                              {nota.xml_envio && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadXML(nota)}
                                  title="Baixar XML"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
    </div>

    <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Imprimir NFS-e</DialogTitle>
        </DialogHeader>
        <div ref={printRef}>
          {selectedNota && <NFSePrintView nota={selectedNota} prestador={prestadorData} />}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
            Fechar
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </AppLayout>
);
}
