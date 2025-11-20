import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X } from 'lucide-react';

interface NewInternalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const setores = [
  { value: 'fiscal', label: 'Departamento Fiscal' },
  { value: 'pessoal', label: 'Departamento Pessoal (DP)' },
  { value: 'contabil', label: 'Departamento Contábil' },
  { value: 'controladoria', label: 'Controladoria' },
  { value: 'procuradoria', label: 'Procuradoria' },
];

export function NewInternalRequestDialog({ open, onOpenChange }: NewInternalRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setor, setSetor] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nome_razao_social, cnpj_cpf, email')
        .eq('situacao', 'Ativo')
        .order('nome_razao_social');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de clientes',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setAssunto('');
    setDescricao('');
    setSetor('');
    setFiles([]);
    setSearchTerm('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      client.nome_razao_social?.toLowerCase().includes(term) ||
      client.cnpj_cpf?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId || !assunto || !descricao || !setor) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar a solicitação (protocolo será gerado automaticamente pelo trigger)
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert([{
          client_id: selectedClientId,
          setor: setor as any,
          assunto,
          descricao,
          protocol: '', // Será substituído pelo trigger
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      // Inserir mensagem inicial
      const { error: messageError } = await supabase
        .from('request_messages')
        .insert({
          request_id: request.id,
          user_id: user.id,
          tipo_mensagem: 'texto',
          conteudo: descricao,
        });

      if (messageError) throw messageError;

      // Upload de arquivos se houver
      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${user.id}/${request.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('request-files')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('request-files')
            .getPublicUrl(fileName);

          const { error: fileMessageError } = await supabase
            .from('request_messages')
            .insert({
              request_id: request.id,
              user_id: user.id,
              tipo_mensagem: 'arquivo',
              file_url: publicUrl,
              filename: file.name,
            });

          if (fileMessageError) throw fileMessageError;
        }
      }

      toast({
        title: 'Sucesso',
        description: `Solicitação criada com protocolo ${request.protocol}`,
      });

      resetForm();
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao criar solicitação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar solicitação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Solicitação para Cliente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <div className="space-y-2">
              <Input
                placeholder="Buscar cliente por nome, CNPJ/CPF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome_razao_social} - {client.cnpj_cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setor">Setor *</Label>
            <Select value={setor} onValueChange={setSetor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto *</Label>
            <Input
              id="assunto"
              placeholder="Ex: Dúvida sobre declaração"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o motivo do contato..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Anexar Arquivos (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Solicitação'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
