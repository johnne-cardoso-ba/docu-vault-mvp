import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WelcomeCardProps {
  userName: string;
  userEmail: string;
  accountStatus: 'ok' | 'pending' | 'warning';
}

export function WelcomeCard({ userName, userEmail, accountStatus }: WelcomeCardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getStatusText = () => {
    switch (accountStatus) {
      case 'ok':
        return 'Tudo em dia! 🎉';
      case 'pending':
        return 'Documentos pendentes ⏳';
      case 'warning':
        return 'Atenção necessária ⚠️';
    }
  };

  const getStatusColor = () => {
    switch (accountStatus) {
      case 'ok':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'warning':
        return 'text-red-600';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {getGreeting()}, {userName.split(' ')[0]}!
            </h2>
            <p className="text-sm text-muted-foreground mb-2">{userEmail}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <div className={`mt-3 font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
