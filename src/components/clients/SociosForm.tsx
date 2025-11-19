import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from 'lucide-react';

type Socio = {
  nome: string;
  capital: string;
  porcentagem: string;
  responsavel_legal: boolean;
};

interface SociosFormProps {
  socios: Socio[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Socio, value: string | boolean) => void;
}

export function SociosForm({ socios, onAdd, onRemove, onUpdate }: SociosFormProps) {
  const totalPorcentagem = socios.reduce((sum, s) => sum + parseFloat(s.porcentagem || '0'), 0);
  const totalCapital = socios.reduce((sum, s) => sum + parseFloat(s.capital || '0'), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Sócios</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione os sócios e suas respectivas participações
          </p>
        </div>
        <Button type="button" onClick={onAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Sócio
        </Button>
      </div>

      {socios.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum sócio adicionado</p>
          <p className="text-sm">Clique em "Adicionar Sócio" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {socios.map((socio, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Sócio {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor={`socio-nome-${index}`}>Nome Completo *</Label>
                  <Input
                    id={`socio-nome-${index}`}
                    value={socio.nome}
                    onChange={(e) => onUpdate(index, 'nome', e.target.value)}
                    placeholder="Nome completo do sócio"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor={`socio-capital-${index}`}>Capital Social (R$) *</Label>
                  <Input
                    id={`socio-capital-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={socio.capital}
                    onChange={(e) => onUpdate(index, 'capital', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor={`socio-porcentagem-${index}`}>Participação (%) *</Label>
                  <Input
                    id={`socio-porcentagem-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={socio.porcentagem}
                    onChange={(e) => onUpdate(index, 'porcentagem', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="col-span-2 flex items-center space-x-2">
                  <Checkbox
                    id={`socio-responsavel-${index}`}
                    checked={socio.responsavel_legal}
                    onCheckedChange={(checked) => onUpdate(index, 'responsavel_legal', checked as boolean)}
                  />
                  <Label htmlFor={`socio-responsavel-${index}`} className="cursor-pointer">
                    É o responsável legal da empresa
                  </Label>
                </div>
              </div>
            </div>
          ))}

          {/* Totais */}
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Total de Capital Social:</span>
                <span className="font-semibold">
                  R$ {totalCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total de Participação:</span>
                <span className={`font-semibold ${totalPorcentagem !== 100 ? 'text-destructive' : 'text-green-600'}`}>
                  {totalPorcentagem.toFixed(2)}%
                </span>
              </div>
            </div>
            {totalPorcentagem !== 100 && (
              <p className="text-xs text-destructive mt-2">
                Atenção: A soma das participações deve totalizar 100%
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
