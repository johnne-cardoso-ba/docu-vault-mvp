import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, Receipt, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Nova Solicitação',
      description: 'Abra uma nova solicitação',
      icon: MessageSquare,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/solicitacoes'),
    },
    {
      title: 'Ver Documentos',
      description: 'Acesse seus documentos',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => navigate('/documentos'),
    },
    {
      title: 'Guias e Boletos',
      description: 'Consulte suas guias',
      icon: Receipt,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/documentos'),
    },
    {
      title: 'Ajuda',
      description: 'Central de ajuda',
      icon: HelpCircle,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => navigate('/solicitacoes'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso Rápido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 transition-all"
              onClick={action.onClick}
            >
              <div className={`${action.color} p-2 rounded-lg mb-2 text-white`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
