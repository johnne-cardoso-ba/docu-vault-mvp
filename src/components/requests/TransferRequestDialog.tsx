import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TransferRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onTransferComplete: () => void;
}

const setoresLabels: Record<string, string> = {
  fiscal: 'Fiscal',
  pessoal: 'Pessoal',
  contabil: 'Contábil',
  controladoria: 'Controladoria',
  procuradoria: 'Procuradoria',
};

export function TransferRequestDialog({ open, onOpenChange, request, onTransferComplete }: TransferRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingColaboradores, setLoadingColaboradores] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [transferType, setTransferType] = useState<'setor' | 'colaborador'>('setor');
  const [targetSetor, setTargetSetor] = useState('');
  const [targetColaborador, setTargetColaborador] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (open) {
      loadColaboradores();
    }
  }, [open]);

  const loadColaboradores = async () => {
    setLoadingColaboradores(true);
    try {
      // Buscar roles de colaboradores e admins
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['colaborador', 'admin']);

      if (rolesError) throw rolesError;
      
      if (!rolesData || rolesData.length === 0) {
        console.log('Nenhum colaborador ou admin encontrado');
        setColaboradores([]);
        return;
      }

      // Buscar perfis dos colaboradores e admins
      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      console.log('Colaboradores carregados:', profilesData);
      setColaboradores(profilesData || []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast({
        title: 'Erro ao carregar colaboradores',
        description: 'Não foi possível carregar a lista de colaboradores.',
        variant: 'destructive',
      });
    } finally {
      setLoadingColaboradores(false);
    }
  };

  const handleTransfer = async () => {
    if (transferType === 'setor' && !targetSetor) {
      toast({
        title: 'Setor não selecionado',
        description: 'Por favor, selecione um setor de destino.',
        variant: 'destructive',
      });
      return;
    }

    if (transferType === 'colaborador' && !targetColaborador) {
      toast({
        title: 'Colaborador não selecionado',
        description: 'Por favor, selecione um colaborador de destino.',
        variant: 'destructive',
      });
      return;
    }

    if (!motivo.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Por favor, informe o motivo da transferência.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updates: any = {};
      let descricaoHistorico = '';

      if (transferType === 'setor') {
        updates.setor = targetSetor;
        updates.atendente_id = null; // Remove atendente ao transferir setor
        descricaoHistorico = `Transferido para o setor ${setoresLabels[targetSetor]}. Motivo: ${motivo}`;
      } else {
        updates.atendente_id = targetColaborador;
        const colaborador = colaboradores.find(c => c.id === targetColaborador);
        descricaoHistorico = `Transferido para o colaborador ${colaborador?.nome}. Motivo: ${motivo}`;
      }

      // Atualizar solicitação
      const { error: updateError } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Registrar no histórico
      const { error: historyError } = await supabase
        .from('request_history')
        .insert({
          request_id: request.id,
          changed_by: user.id,
          tipo_mudanca: 'transferencia',
          valor_anterior: transferType === 'setor' ? request.setor : request.atendente_id,
          valor_novo: transferType === 'setor' ? targetSetor : targetColaborador,
          descricao: descricaoHistorico,
        });

      if (historyError) throw historyError;

      toast({
        title: 'Transferência realizada',
        description: 'A solicitação foi transferida com sucesso.',
      });

      onTransferComplete();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao transferir:', error);
      toast({
        title: 'Erro ao transferir',
        description: 'Não foi possível transferir a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTransferType('setor');
    setTargetSetor('');
    setTargetColaborador('');
    setMotivo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir Atendimento</DialogTitle>
          <DialogDescription>
            Protocolo: #{request?.protocol}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Transferência</Label>
            <Select value={transferType} onValueChange={(value: any) => setTransferType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="setor">Para outro setor</SelectItem>
                <SelectItem value="colaborador">Para colaborador específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transferType === 'setor' && (
            <div className="space-y-2">
              <Label>Setor de Destino</Label>
              <Select value={targetSetor} onValueChange={setTargetSetor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiscal">Fiscal</SelectItem>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                  <SelectItem value="contabil">Contábil</SelectItem>
                  <SelectItem value="controladoria">Controladoria</SelectItem>
                  <SelectItem value="procuradoria">Procuradoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {transferType === 'colaborador' && (
            <div className="space-y-2">
              <Label>Colaborador de Destino</Label>
              {loadingColaboradores ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : colaboradores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nenhum colaborador disponível
                </p>
              ) : (
                <Select value={targetColaborador} onValueChange={setTargetColaborador}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {colaboradores.map((colab) => (
                      <SelectItem key={colab.id} value={colab.id}>
                        {colab.nome} ({colab.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Motivo da Transferência</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da transferência..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleTransfer} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
