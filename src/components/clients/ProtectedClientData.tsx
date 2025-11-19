import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type Socio = {
  nome: string;
  cpf: string;
  capital: string;
  porcentagem: string;
};

type ClientData = {
  nome_razao_social: string;
  cpf?: string | null;
  cnpj?: string | null;
  email: string;
  telefone?: string | null;
  nome_socio?: string | null;
  data_nascimento?: string | null;
  socios?: any;
  juceb_nire?: string | null;
  juceb_protocolo?: string | null;
  juceb_data_registro?: string | null;
  numero_iptu?: string | null;
  numero_titulo?: string | null;
  codigo_simples?: string | null;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  atividade_principal?: string | null;
  regime_tributario?: string | null;
  responsavel_legal?: string | null;
  campos_customizados?: any;
};

export function ProtectedClientData() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar senha do usuário
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) throw new Error('Usuário não autenticado');

      // Tentar fazer login novamente com a senha para validar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        throw new Error('Senha incorreta');
      }

      // Buscar dados do cliente
      const { data: clientsData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email!)
        .single();

      if (clientError) throw clientError;

      setClientData(clientsData);
      setIsUnlocked(true);
      
      toast({
        title: 'Acesso liberado!',
        description: 'Seus dados cadastrais estão agora visíveis',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao verificar senha',
        description: error.message || 'Senha incorreta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Dados Cadastrais Protegidos</CardTitle>
          </div>
          <CardDescription>
            Digite sua senha para visualizar suas informações cadastrais completas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desbloquear Dados
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (!clientData) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Nenhum dado cadastral encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Nome / Razão Social</Label>
            <p className="font-medium">{clientData.nome_razao_social}</p>
          </div>
          {clientData.cpf && (
            <div>
              <Label className="text-muted-foreground">CPF</Label>
              <p className="font-medium">{clientData.cpf}</p>
            </div>
          )}
          {clientData.cnpj && (
            <div>
              <Label className="text-muted-foreground">CNPJ</Label>
              <p className="font-medium">{clientData.cnpj}</p>
            </div>
          )}
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{clientData.email}</p>
          </div>
          {clientData.telefone && (
            <div>
              <Label className="text-muted-foreground">Telefone</Label>
              <p className="font-medium">{clientData.telefone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quadro Societário */}
      {clientData.socios && Array.isArray(clientData.socios) && clientData.socios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quadro Societário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Nome do Sócio</th>
                    <th className="text-left p-3 font-semibold">CPF</th>
                    <th className="text-right p-3 font-semibold">Capital (R$)</th>
                    <th className="text-right p-3 font-semibold">Participação (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {clientData.socios.map((socio, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{socio.nome}</td>
                      <td className="p-3">{socio.cpf}</td>
                      <td className="p-3 text-right">
                        {parseFloat(socio.capital || '0').toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-3 text-right">{socio.porcentagem}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registros */}
      {(clientData.juceb_nire || clientData.juceb_protocolo || clientData.juceb_data_registro) && (
        <Card>
          <CardHeader>
            <CardTitle>Registros JUCEB</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientData.juceb_nire && (
              <div>
                <Label className="text-muted-foreground">NIRE</Label>
                <p className="font-medium">{clientData.juceb_nire}</p>
              </div>
            )}
            {clientData.juceb_protocolo && (
              <div>
                <Label className="text-muted-foreground">Protocolo</Label>
                <p className="font-medium">{clientData.juceb_protocolo}</p>
              </div>
            )}
            {clientData.juceb_data_registro && (
              <div>
                <Label className="text-muted-foreground">Data de Registro</Label>
                <p className="font-medium">
                  {format(new Date(clientData.juceb_data_registro), 'dd/MM/yyyy')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Endereço */}
      {(clientData.cep || clientData.logradouro || clientData.cidade) && (
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientData.cep && (
              <div>
                <Label className="text-muted-foreground">CEP</Label>
                <p className="font-medium">{clientData.cep}</p>
              </div>
            )}
            {clientData.logradouro && (
              <div className="col-span-2">
                <Label className="text-muted-foreground">Logradouro</Label>
                <p className="font-medium">
                  {clientData.logradouro}
                  {clientData.numero && `, ${clientData.numero}`}
                </p>
              </div>
            )}
            {clientData.complemento && (
              <div>
                <Label className="text-muted-foreground">Complemento</Label>
                <p className="font-medium">{clientData.complemento}</p>
              </div>
            )}
            {clientData.bairro && (
              <div>
                <Label className="text-muted-foreground">Bairro</Label>
                <p className="font-medium">{clientData.bairro}</p>
              </div>
            )}
            {clientData.cidade && (
              <div>
                <Label className="text-muted-foreground">Cidade</Label>
                <p className="font-medium">{clientData.cidade}</p>
              </div>
            )}
            {clientData.estado && (
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <p className="font-medium">{clientData.estado}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações Fiscais */}
      {(clientData.inscricao_estadual || clientData.inscricao_municipal || clientData.regime_tributario) && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Fiscais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientData.regime_tributario && (
              <div>
                <Label className="text-muted-foreground">Regime Tributário</Label>
                <p className="font-medium">{clientData.regime_tributario}</p>
              </div>
            )}
            {clientData.inscricao_estadual && (
              <div>
                <Label className="text-muted-foreground">Inscrição Estadual</Label>
                <p className="font-medium">{clientData.inscricao_estadual}</p>
              </div>
            )}
            {clientData.inscricao_municipal && (
              <div>
                <Label className="text-muted-foreground">Inscrição Municipal</Label>
                <p className="font-medium">{clientData.inscricao_municipal}</p>
              </div>
            )}
            {clientData.codigo_simples && (
              <div>
                <Label className="text-muted-foreground">Código Simples Nacional</Label>
                <p className="font-medium">{clientData.codigo_simples}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campos Customizados */}
      {clientData.campos_customizados && Object.keys(clientData.campos_customizados).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(clientData.campos_customizados).map(([key, value]) => (
              <div key={key}>
                <Label className="text-muted-foreground">{key}</Label>
                <p className="font-medium">{value as string}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setIsUnlocked(false)}>
          <Lock className="mr-2 h-4 w-4" />
          Bloquear Dados
        </Button>
      </div>
    </div>
  );
}
