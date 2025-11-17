import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

type Client = {
  id: string;
  nome_razao_social: string;
};

export default function UploadDocument() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    competencia: '',
    vencimento: '',
    valor_guia: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !formData.client_id || !formData.competencia) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um cliente, arquivo e informe a competência',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${formData.client_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('documents').insert([{
        client_id: formData.client_id,
        uploaded_by: user?.id,
        filename: file.name,
        file_url: publicUrl,
        competencia: formData.competencia,
        vencimento: formData.vencimento || null,
        valor_guia: formData.valor_guia ? parseFloat(formData.valor_guia) : null,
      }]);

      if (insertError) throw insertError;

      toast({ title: 'Documento enviado com sucesso!' });
      
      setFile(null);
      setFormData({
        client_id: '',
        competencia: '',
        vencimento: '',
        valor_guia: '',
      });
      
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar documento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Enviar Documento</h2>
          <p className="text-muted-foreground mt-2">Faça upload de documentos para os clientes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Novo Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="valor">Valor da Guia</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valor_guia}
                  onChange={(e) => setFormData({ ...formData, valor_guia: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Documento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
