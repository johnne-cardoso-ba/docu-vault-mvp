import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Upload, UserCog } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

export default function Dashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-2">Bem-vindo ao sistema de gestão de documentos contábeis</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userRole === 'admin' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/colaboradores')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  Colaboradores
                </CardTitle>
                <CardDescription>Gerenciar usuários colaboradores</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cadastrar e gerenciar colaboradores do sistema
                </p>
              </CardContent>
            </Card>
          )}

          {(userRole === 'admin' || userRole === 'colaborador') && (
            <>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/clientes')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Clientes
                  </CardTitle>
                  <CardDescription>Gerenciar clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cadastrar e gerenciar informações dos clientes
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/enviar-documento')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Enviar Documentos
                  </CardTitle>
                  <CardDescription>Upload de documentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Fazer upload de documentos para os clientes
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/documentos')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos
              </CardTitle>
              <CardDescription>Visualizar documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualizar e gerenciar todos os documentos enviados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}