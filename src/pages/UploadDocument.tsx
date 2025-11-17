import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Client = {
  id: string;
  nome_razao_social: string;
};

export default function UploadDocument() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
        .eq('situacao', 'ativo')
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
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${formData.client_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Insert document record
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
      
      // Reset form
      setFile(null);
      setFormData({
        client_id: '',
        competencia: '',
        vencimento: '',
        valor_guia: '',
      });
      
      // Clear file input
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Enviar Documento</h1>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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

              <div>
                <Label htmlFor="file">Documento *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ofx,.txt"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: PDF, Word, Excel, OFX, TXT
                </p>
              </div>

              <div>
                <Label htmlFor="competencia">Competência *</Label>
                <Input
                  id="competencia"
                  type="text"
                  placeholder="Ex: 01/2025"
                  value={formData.competencia}
                  onChange={(e) => setFormData({ ...formData, competencia: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="vencimento">Data de Vencimento</Label>
                <Input
                  id="vencimento"
                  type="date"
                  value={formData.vencimento}
                  onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                />
              </div>

              <div>
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
      </main>
    </div>
  );
}