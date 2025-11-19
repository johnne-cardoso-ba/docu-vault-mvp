import { LayoutDashboard, Users, FileText, Upload, LogOut, UserCog, MessageSquare, Headset } from 'lucide-react';
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
import logo from '@/assets/logo-escritura.png';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRole, signOut } = useAuth();
  const currentPath = location.pathname;

  const adminItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Clientes', url: '/clientes', icon: Users },
    { title: 'Colaboradores', url: '/colaboradores', icon: UserCog },
    { title: 'Enviar Documento', url: '/enviar-documento', icon: Upload },
    { title: 'Documentos', url: '/documentos', icon: FileText },
    { title: 'Atendimento', url: '/solicitacoes-internas', icon: Headset },
  ];

  const colaboradorItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Clientes', url: '/clientes', icon: Users },
    { title: 'Enviar Documento', url: '/enviar-documento', icon: Upload },
    { title: 'Documentos', url: '/documentos', icon: FileText },
    { title: 'Atendimento', url: '/solicitacoes-internas', icon: Headset },
  ];

  const clienteItems = [
    { title: 'Documentos', url: '/documentos', icon: FileText },
    { title: 'Solicitações', url: '/solicitacoes', icon: MessageSquare },
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
