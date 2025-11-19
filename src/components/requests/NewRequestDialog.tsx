import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X } from 'lucide-react';

interface NewRequestDialogProps {
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

export function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setor, setSetor] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assunto || !descricao || !setor) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar o client_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (!client) throw new Error('Cliente não encontrado');

      // Criar a solicitação (protocolo será gerado automaticamente pelo trigger)
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert([{
          client_id: client.id,
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

          await supabase.from('request_messages').insert({
            request_id: request.id,
            user_id: user.id,
            tipo_mensagem: 'arquivo',
            file_url: publicUrl,
            filename: file.name,
          });
        }
      }

      toast({
        title: 'Sucesso!',
        description: `Solicitação criada com protocolo ${request.protocol}`,
      });

      setAssunto('');
      setDescricao('');
      setSetor('');
      setFiles([]);
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar solicitação',
        description: error.message,
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
          <DialogTitle>Nova Solicitação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Digite o assunto da solicitação"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua solicitação em detalhes"
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Anexar Arquivos</Label>
            <div className="flex items-center gap-2">
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="flex-1"
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Solicitação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
