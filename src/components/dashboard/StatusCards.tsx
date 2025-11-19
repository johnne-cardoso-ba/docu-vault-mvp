import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, AlertCircle, DollarSign, CheckCircle } from 'lucide-react';

interface StatusCardsProps {
  documentsReceived: number;
  unreadDocuments: number;
  dueSoonCount: number;
  totalToPay: number;
  obligationsDelivered: number;
  totalObligations: number;
}

export function StatusCards({
  documentsReceived,
  unreadDocuments,
  dueSoonCount,
  totalToPay,
  obligationsDelivered,
  totalObligations,
}: StatusCardsProps) {
  const cards = [
    {
      title: 'Documentos Recebidos',
      value: documentsReceived,
      subtitle: 'Últimos 30 dias',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Documentos Não Lidos',
      value: unreadDocuments,
      subtitle: unreadDocuments > 0 ? 'Requer atenção' : 'Tudo em dia',
      icon: Eye,
      color: unreadDocuments > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: unreadDocuments > 0 ? 'bg-red-50' : 'bg-green-50',
      badge: unreadDocuments > 0,
    },
    {
      title: 'Guias Vencendo',
      value: dueSoonCount,
      subtitle: 'Próximos 7 dias',
      icon: AlertCircle,
      color: dueSoonCount > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: dueSoonCount > 0 ? 'bg-orange-50' : 'bg-gray-50',
    },
    {
      title: 'Valores a Pagar',
      value: totalToPay,
      subtitle: 'Mês atual',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isCurrency: true,
    },
    {
      title: 'Obrigações Entregues',
      value: `${obligationsDelivered}/${totalObligations}`,
      subtitle: `${Math.round((obligationsDelivered / (totalObligations || 1)) * 100)}% completo`,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isProgress: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`${card.bgColor} p-2 rounded-lg`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.isCurrency
                  ? `R$ ${card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : card.value}
              </div>
              {card.badge && (
                <Badge variant="destructive" className="h-5">
                  Novo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            {card.isProgress && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${card.bgColor} h-2 rounded-full transition-all`}
                  style={{ width: `${(obligationsDelivered / (totalObligations || 1)) * 100}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
