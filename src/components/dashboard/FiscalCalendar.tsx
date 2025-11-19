import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DueDate {
  id: string;
  title: string;
  dueDate: string;
  amount?: number;
  type: 'DARF' | 'GPS' | 'DAS' | 'GUIA' | 'DECLARACAO';
}

interface FiscalCalendarProps {
  upcomingDueDates: DueDate[];
}

export function FiscalCalendar({ upcomingDueDates }: FiscalCalendarProps) {
  const getUrgencyColor = (dueDate: string): "default" | "destructive" | "outline" | "secondary" => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return 'destructive';
    if (days <= 3) return 'destructive';
    if (days <= 7) return 'secondary';
    return 'default';
  };

  const getUrgencyText = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return 'Vencido';
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `${days} dias`;
  };

  const sortedDates = [...upcomingDueDates].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Calendário Fiscal</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum vencimento próximo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    <Badge variant={getUrgencyColor(item.dueDate)} className="text-xs">
                      {getUrgencyText(item.dueDate)}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vencimento: {format(new Date(item.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                {item.amount && (
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
