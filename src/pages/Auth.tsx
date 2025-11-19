import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import logoEscritura from '@/assets/logo-escritura.png';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();

  // Carregar preferência de "lembrar-me" ao montar
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    setRememberMe(savedRememberMe);
    
    // Se tinha marcado "lembrar-me", preencher o último email usado
    if (savedRememberMe) {
      const savedEmail = localStorage.getItem('savedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Salvar email se "lembrar-me" estiver marcado
    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    const { error } = await signIn(email, password, rememberMe);

    if (error) {
      toast({
        title: 'Erro ao fazer login',
        description: error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md relative">
        {/* Borda gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 rounded-lg blur-sm opacity-75"></div>
        
        <Card className="relative bg-background border-0 shadow-2xl">
          <CardHeader className="space-y-6 pb-4">
            <div className="flex justify-center">
              <img 
                src={logoEscritura} 
                alt="Escritura AI" 
                className="h-20 w-auto"
              />
            </div>
            <CardDescription className="text-center text-base">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Lembrar-me neste dispositivo
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}