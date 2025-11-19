import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, Clock, FileText } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { FileDropZone } from '@/components/upload/FileDropZone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Client = {
  id: string;
  nome_razao_social: string;
};

type FileUploadStatus = {
  filename: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
};

type RecentUpload = {
  id: string;
  filename: string;
  client_name: string;
  competencia: string;
  uploaded_at: string;
};

const documentTypes = [
  { value: 'folha', label: 'Folha de Pagamento' },
  { value: 'darf', label: 'DARF' },
  { value: 'gps', label: 'GPS' },
  { value: 'das', label: 'DAS' },
  { value: 'nfe', label: 'Nota Fiscal' },
  { value: 'outros', label: 'Outros' },
];

export default function UploadDocument() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<FileUploadStatus[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    competencia: '',
    vencimento: '',
    valor_guia: '',
    document_type: 'outros',
  });

  useEffect(() => {
    fetchClients();
    fetchRecentUploads();
  }, []);

  // Auto-detect competência from filename
  useEffect(() => {
    if (files.length > 0 && !formData.competencia) {
      const filename = files[0].name;
      const monthYearMatch = filename.match(/(\d{2})[\/\-_]?(\d{4})|(\d{4})[\/\-_]?(\d{2})/);
      if (monthYearMatch) {
        const month = monthYearMatch[1] || monthYearMatch[4];
        const year = monthYearMatch[2] || monthYearMatch[3];
        setFormData(prev => ({ ...prev, competencia: `${month}/${year}` }));
      }
    }
  }, [files]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nome_razao_social')
        .eq('situacao', 'Ativo')
        .order('nome_razao_social');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar clientes',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchRecentUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          filename,
          competencia,
          created_at,
          clients (nome_razao_social)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const uploads: RecentUpload[] = (data || []).map(doc => ({
        id: doc.id,
        filename: doc.filename,
        client_name: (doc.clients as any)?.nome_razao_social || 'Cliente não encontrado',
        competencia: doc.competencia,
        uploaded_at: doc.created_at,
      }));

      setRecentUploads(uploads);
    } catch (error: any) {
      console.error('Erro ao carregar uploads recentes:', error);
    }
  };

  const uploadFile = async (file: File, index: number): Promise<boolean> => {
    try {
      // Update status to uploading
      setUploadStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          filename: file.name,
          status: 'uploading',
          progress: 0,
        };
        return newStatuses;
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${formData.client_id}/${fileName}`;

      // Simulate progress
      for (let progress = 0; progress <= 90; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadStatuses(prev => {
          const newStatuses = [...prev];
          newStatuses[index].progress = progress;
          return newStatuses;
        });
      }

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('documents').insert([{
        client_id: formData.client_id,
        uploaded_by: user?.id,
        filename: file.name,
        file_url: filePath,
        competencia: formData.competencia,
        vencimento: formData.vencimento || null,
        valor_guia: formData.valor_guia ? parseFloat(formData.valor_guia) : null,
      }]);

      if (insertError) throw insertError;

      // Update status to success
      setUploadStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          filename: file.name,
          status: 'success',
          progress: 100,
        };
        return newStatuses;
      });

      return true;
    } catch (error: any) {
      // Update status to error
      setUploadStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          filename: file.name,
          status: 'error',
          progress: 0,
          error: error.message,
        };
        return newStatuses;
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0 || !formData.client_id || !formData.competencia) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um cliente, arquivos e informe a competência',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setUploadStatuses(files.map(f => ({
      filename: f.name,
      status: 'uploading',
      progress: 0,
    })));

    try {
      const results = await Promise.all(
        files.map((file, index) => uploadFile(file, index))
      );

      const successCount = results.filter(r => r).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: 'Upload concluído!',
          description: `${successCount} documento(s) enviado(s) com sucesso${failCount > 0 ? `, ${failCount} falhou(aram)` : ''}`,
        });

        setFiles([]);
        setFormData({
          client_id: '',
          competencia: '',
          vencimento: '',
          valor_guia: '',
          document_type: 'outros',
        });

        fetchRecentUploads();

        setTimeout(() => {
          setUploadStatuses([]);
        }, 3000);
      } else {
        toast({
          title: 'Erro no upload',
          description: 'Nenhum arquivo foi enviado com sucesso',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar documentos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentUploadData = (upload: RecentUpload) => {
    const client = clients.find(c => c.nome_razao_social === upload.client_name);
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: client.id,
        competencia: upload.competencia,
      }));
      toast({
        title: 'Dados carregados',
        description: 'Use os dados do upload anterior como base',
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Enviar Documentos</h2>
          <p className="text-muted-foreground mt-2">
            Faça upload de documentos para seus clientes de forma rápida e organizada
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload de Documentos</CardTitle>
                <CardDescription>
                  Selecione os arquivos e preencha as informações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Checklist Visual */}
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      {formData.client_id ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm">Cliente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {files.length > 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm">Arquivo(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.competencia ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm">Competência</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente *</Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nome_razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document_type">Tipo de Documento</Label>
                    <Select
                      value={formData.document_type}
                      onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FileDropZone
                    files={files}
                    onFilesChange={setFiles}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="competencia">Competência *</Label>
                      <Input
                        id="competencia"
                        placeholder="Ex: 01/2025"
                        value={formData.competencia}
                        onChange={(e) => setFormData({ ...formData, competencia: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vencimento">Data de Vencimento</Label>
                      <Input
                        id="vencimento"
                        type="date"
                        value={formData.vencimento}
                        onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor da Guia (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor_guia}
                      onChange={(e) => setFormData({ ...formData, valor_guia: e.target.value })}
                    />
                  </div>

                  <UploadProgress uploads={uploadStatuses} />

                  <Button type="submit" className="w-full" disabled={loading || files.length === 0}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando {files.length} arquivo(s)...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar {files.length > 0 ? `${files.length} documento(s)` : 'Documentos'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Uploads Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Envios Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentUploads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum envio recente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => loadRecentUploadData(upload)}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-primary mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{upload.filename}</p>
                            <p className="text-xs text-muted-foreground truncate">{upload.client_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {upload.competencia} • {format(new Date(upload.uploaded_at), 'dd/MM', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
