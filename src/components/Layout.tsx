import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  ArrowLeftRight,
  LogOut,
  Building2,
  User,
  Users,
  Settings,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ClipboardCheck,
  CreditCard,
  ScanLine,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { logout as logoutApi } from '@/api/auth';
import { toast } from '@/hooks/use-toast';
import { getPendingTransferCount } from '@/api/stock';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Items', url: '/items', icon: Package },
  { title: 'Locations', url: '/locations', icon: MapPin },
  { title: 'Stock Movements', url: '/stock', icon: ArrowLeftRight },
  { title: 'Approvals Inbox', url: '/stock/approvals', icon: ClipboardCheck, hasBadge: true },
];

const adminItems = [
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Departments', url: '/admin/departments', icon: Building2 },
  { title: 'Incidents', url: '/admin/security/incidents', icon: ShieldAlert },
  { title: 'Risk Register', url: '/admin/security/risks', icon: AlertTriangle },
];

const settingsItems = [
  { title: 'Company', url: '/admin/company', icon: Settings, adminOnly: true },
  /* { title: 'Billing & Plans', url: '/billing', icon: CreditCard, adminOnly: true }, */
  { title: 'Attributes', url: '/admin/settings/attributes', icon: Package },
  { title: 'Security & MFA', url: '/admin/settings/security', icon: ShieldCheck, adminOnly: true },
  { title: 'Audit Logs', url: '/admin/audit-logs', icon: ShieldCheck, adminOrDept: true },
];

if (import.meta.env.VITE_ENABLE_BILLING === 'true') {
  settingsItems.splice(1, 0, { title: 'Billing & Plans', url: '/billing', icon: CreditCard, adminOnly: true });
}



function AppSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const collapsed = state === 'collapsed';
  const { user } = useAuthStore();
  const isAdmin = user?.is_tenant_admin;

  const isLinkActive = (url: string) => {
    // If it's an exact match, it's definitely active
    if (pathname === url) return true;

    // Handle root specially
    if (url === '/') return pathname === '/';

    // Check if the current path is a sub-page of this URL (e.g. /items/123 matches /items)
    // We only want to highlight the parent if there isn't a more specific menu item for this sub-page.
    const isSubPage = pathname.startsWith(url + '/');
    if (!isSubPage) return false;

    // Is there another menu item that is a more specific match for the current path?
    const allLinks = [
      ...navItems.map(i => i.url),
      ...adminItems.map(i => i.url),
      ...settingsItems.map(i => i.url)
    ];

    const hasBetterMatch = allLinks.some(link => 
      link !== url && 
      pathname.startsWith(link) && 
      link.length > url.length
    );

    return !hasBetterMatch;
  };
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getPendingTransferCount();
        setPendingCount(count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Building2 className="mr-2 h-4 w-4" />
            {!collapsed && 'RMM System'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isLinkActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={active}
                      className={active ? "bg-sidebar-accent/50 text-sidebar-accent-foreground" : ""}
                    >
                      <NavLink to={item.url} end={item.url === '/'}>
                        <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.title}</span>
                        {active && (
                            <div className="absolute left-0 top-[15%] bottom-[15%] w-1 bg-primary rounded-r-md" />
                        )}
                      {(item as any).hasBadge && pendingCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                          {pendingCount}
                        </span>
                      )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Management */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Users className="mr-2 h-4 w-4" />
              {!collapsed && 'Management'}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const active = isLinkActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={active}
                        className={active ? "bg-sidebar-accent/50 text-sidebar-accent-foreground" : ""}
                      >
                        <NavLink to={item.url}>
                          <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                          <span>{item.title}</span>
                          {active && (
                              <div className="absolute left-0 top-[15%] bottom-[15%] w-1 bg-primary rounded-r-md" />
                          )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="mr-2 h-4 w-4" />
            {!collapsed && 'Settings'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                // Visibility logic
                const isDeptAdmin = user?.role === 'department_admin';
                if (item.adminOnly && !isAdmin) return null;
                if (item.adminOrDept && !isAdmin && !isDeptAdmin) return null;

                const active = isLinkActive(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={active}
                      className={active ? "bg-sidebar-accent/50 text-sidebar-accent-foreground" : ""}
                    >
                      <NavLink to={item.url}>
                        <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.title}</span>
                        {active && (
                            <div className="absolute left-0 top-[15%] bottom-[15%] w-1 bg-primary rounded-r-md" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* Super Admin Link - Only visible to Super Admins */}
        {user?.is_super_admin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                    <NavLink to="/admin/dashboard">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Super Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const bottomNavItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Items', url: '/items', icon: Package },
    { title: 'Scan', url: '/scan', icon: ScanLine },
    { title: 'Stock', url: '/stock', icon: ArrowLeftRight },
    { title: 'Inbox', url: '/stock/approvals', icon: ClipboardCheck },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background border-t h-16 px-2 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
      {bottomNavItems.map(item => {
        const isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url));
        return (
          <NavLink 
            key={item.title} 
            to={item.url} 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors min-h-[44px] min-w-[44px]",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
            <span className="text-[10px] font-medium">{item.title}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

interface LayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export const Layout = ({ children, noPadding = false }: LayoutProps) => {
  useIdleTimer();
  const navigate = useNavigate();
  const { user, tenant, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logoutApi();
      clearAuth();
      navigate('/login');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col relative min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4 shadow-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="min-h-[44px] min-w-[44px]" />
              <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">{tenant?.name}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="min-h-[44px]">
                  <User className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{user?.first_name} {user?.last_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/change-password')} className="min-h-[44px]">
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="min-h-[44px]">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className={cn("flex-1", noPadding ? "p-0 pb-16 md:pb-0" : "p-4 pb-24 md:p-6 md:pb-6")}>{children}</main>
        </div>
      </div>
      <MobileBottomNav />
    </SidebarProvider>
  );
};
