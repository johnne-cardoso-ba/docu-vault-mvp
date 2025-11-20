import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CancelarNFSeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nota: any;
  onSuccess: () => void;
}

export function CancelarNFSeDialog({ open, onOpenChange, nota, onSuccess }: CancelarNFSeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleCancelar = async () => {
    if (!motivo.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    if (motivo.length < 15) {
      toast.error("O motivo deve ter pelo menos 15 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Atualizar o status da nota para cancelada
      const { error: updateError } = await supabase
        .from("nfse_emitidas")
        .update({
          status: "cancelada",
          motivo_cancelamento: motivo,
          cancelada_em: new Date().toISOString(),
        })
        .eq("id", nota.id);

      if (updateError) throw updateError;

      toast.success("NFS-e cancelada com sucesso!");
      onSuccess();
      onOpenChange(false);
      setMotivo("");
    } catch (error: any) {
      console.error("Erro ao cancelar NFS-e:", error);
      toast.error(error.message || "Erro ao cancelar NFS-e");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar NFS-e</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A nota será marcada como cancelada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção!</strong> O cancelamento da nota é permanente.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Número:</span>
                <p className="font-medium">{nota?.numero_nota || `RPS ${nota?.numero_rps}`}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <p className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(nota?.valor_servicos || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do Cancelamento *</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo do cancelamento (mínimo 15 caracteres)"
              rows={4}
              maxLength={255}
              required
            />
            <p className="text-xs text-muted-foreground">
              {motivo.length}/255 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancelar}
            disabled={loading || !motivo.trim() || motivo.length < 15}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
