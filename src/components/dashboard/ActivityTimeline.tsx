import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'document' | 'request' | 'payment' | 'response';
  title: string;
  description: string;
  date: string;
  status?: 'success' | 'pending' | 'info';
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'request':
        return MessageSquare;
      case 'payment':
        return CheckCircle;
      case 'response':
        return MessageSquare;
    }
  };

  const getIconColor = (status?: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Atividades Recentes</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getIcon(activity.type);
              return (
                <div key={activity.id} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className={`p-2 rounded-full ${getIconColor(activity.status)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      </div>
                      {activity.status && (
                        <Badge
                          variant={activity.status === 'success' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {activity.status === 'success' && 'Concluído'}
                          {activity.status === 'pending' && 'Pendente'}
                          {activity.status === 'info' && 'Info'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(activity.date), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
