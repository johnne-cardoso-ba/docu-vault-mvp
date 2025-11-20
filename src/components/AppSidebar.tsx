import { LayoutDashboard, Users, FileText, Upload, LogOut, UserCog, MessageSquare, Headset, User, BarChart3, Settings, Receipt } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import logo from '@/assets/logo-branca.png';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRole, hasNFSeAccess, signOut } = useAuth();
  const currentPath = location.pathname;

  const adminItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Clientes', url: '/clientes', icon: Users },
    { title: 'Colaboradores', url: '/colaboradores', icon: UserCog },
    { title: 'Configurações', url: '/configuracoes-colaboradores', icon: Settings },
    { title: 'Atendimento', url: '/solicitacoes-internas', icon: Headset },
    { title: 'Enviar Documento', url: '/enviar-documento', icon: Upload },
    { title: 'Documentos', url: '/documentos', icon: FileText },
    { title: 'NFS-e', url: '/nfse', icon: Receipt },
    { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  ];

  const colaboradorItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Clientes', url: '/clientes', icon: Users },
    { title: 'Atendimento', url: '/solicitacoes-internas', icon: Headset },
    { title: 'Enviar Documento', url: '/enviar-documento', icon: Upload },
    { title: 'Documentos', url: '/documentos', icon: FileText },
  ];

  const clienteItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Documentos', url: '/documentos', icon: FileText },
    { title: 'Solicitações', url: '/solicitacoes', icon: MessageSquare },
    ...(hasNFSeAccess ? [
      { title: 'Minhas NFS-e', url: '/nfse/cliente', icon: Receipt }
    ] : []),
  ];

  const items = 
    userRole === 'admin' ? adminItems :
    userRole === 'colaborador' ? colaboradorItems :
    clienteItems;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={isCollapsed ? 'w-16' : 'w-64'}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4">
        <img 
          src={logo} 
          alt="Escritura.ai" 
          className={isCollapsed ? 'h-8 w-auto mx-auto' : 'h-10 w-auto'}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="hover:bg-muted/50"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/perfil')}>
              <NavLink
                to="/perfil"
                className="hover:bg-muted/50"
                activeClassName="bg-accent text-accent-foreground font-medium"
              >
                <User className="h-5 w-5" />
                {!isCollapsed && <span>Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
