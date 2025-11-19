import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

type Document = {
  id: string;
  filename: string;
  file_url: string;
  competencia: string;
  vencimento: string | null;
  valor_guia: number | null;
  pago: boolean;
  data_envio: string;
  data_leitura: string | null;
  clients: {
    nome_razao_social: string;
  } | null;
};

export default function Documents() {
  const { userRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [userRole]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          clients(nome_razao_social)
        `)
        .order('data_envio', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar documentos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = async (doc: Document) => {
    try {
      // Generate signed URL for secure access
      const filePath = doc.file_url.split('/').slice(-2).join('/'); // Extract path from URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;

      if (!doc.data_leitura && userRole === 'cliente') {
        await supabase
          .from('documents')
          .update({ data_leitura: new Date().toISOString() })
          .eq('id', doc.id);
        
        fetchDocuments();
      }

      window.open(signedUrlData.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: 'Erro ao abrir documento',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePaidToggle = async (docId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ pago: !currentValue })
        .eq('id', docId);

      if (error) throw error;
      
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Documentos</h2>
          <p className="text-muted-foreground mt-2">Visualize todos os documentos enviados</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  {(userRole === 'admin' || userRole === 'colaborador') && (
                    <TableHead>Cliente</TableHead>
                  )}
                  <TableHead>Competência</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data Envio</TableHead>
                  <TableHead>Data Leitura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <button
                          onClick={() => handleDocumentClick(doc)}
                          className="text-primary hover:underline flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {doc.filename}
                        </button>
                      </TableCell>
                      {(userRole === 'admin' || userRole === 'colaborador') && (
                        <TableCell>{doc.clients?.nome_razao_social || '-'}</TableCell>
                      )}
                      <TableCell>{doc.competencia}</TableCell>
                      <TableCell>
                        {doc.vencimento ? new Date(doc.vencimento).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        {doc.valor_guia ? `R$ ${doc.valor_guia.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={doc.pago}
                          onCheckedChange={() => handlePaidToggle(doc.id, doc.pago)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(doc.data_envio).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {doc.data_leitura ? new Date(doc.data_leitura).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
