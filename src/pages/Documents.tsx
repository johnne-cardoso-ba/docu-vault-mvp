import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  client: {
    nome_razao_social: string;
  } | null;
};

export default function Documents() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [userRole]);

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          client:clients(nome_razao_social)
        `)
        .order('data_envio', { ascending: false });

      const { data, error } = await query;

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
      // Mark as read if first time
      if (!doc.data_leitura && userRole === 'cliente') {
        await supabase
          .from('documents')
          .update({ data_leitura: new Date().toISOString() })
          .eq('id', doc.id);
        
        fetchDocuments(); // Refresh list
      }

      // Open document
      window.open(doc.file_url, '_blank');
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
      
      fetchDocuments(); // Refresh list
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const canGoBack = userRole !== 'cliente';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {canGoBack && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-2xl font-bold text-primary">Documentos Recebidos</h1>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  {userRole !== 'cliente' && <TableHead>Cliente</TableHead>}
                  <TableHead>Competência</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor da Guia</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Data de Leitura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === 'cliente' ? 7 : 8} className="text-center text-muted-foreground">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto font-normal"
                          onClick={() => handleDocumentClick(doc)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {doc.filename}
                        </Button>
                      </TableCell>
                      {userRole !== 'cliente' && (
                        <TableCell>{doc.client?.nome_razao_social || '-'}</TableCell>
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
                          disabled={userRole !== 'cliente'}
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
      </main>
    </div>
  );
}