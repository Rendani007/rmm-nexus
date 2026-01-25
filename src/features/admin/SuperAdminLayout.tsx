import { ReactNode } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    LogOut,
    User,
    ShieldCheck,
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

const adminNavItems = [
    { title: 'Overview', url: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Tenants', url: '/admin/tenants', icon: Building2 },
    { title: 'Audit Logs', url: '/admin/audit-logs', icon: ShieldCheck },
];

function AdminSidebar() {
    const { state } = useSidebar();
    const collapsed = state === 'collapsed';

    return (
        <Sidebar collapsible="icon" className="border-r-amber-500/20">
            {/* Just a slight visual hint using border or similar if desirable, defaulting to standard style for now */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <ShieldCheck className="mr-2 h-4 w-4 text-amber-600" />
                        {!collapsed && 'Super Admin'}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            className={({ isActive }) =>
                                                isActive ? 'bg-sidebar-accent' : ''
                                            }
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

interface LayoutProps {
    children: ReactNode;
}

export const SuperAdminLayout = ({ children }: LayoutProps) => {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();

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
            <div className="flex min-h-screen w-full">
                <AdminSidebar />
                <div className="flex flex-1 flex-col">
                    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger />
                            <h1 className="text-lg font-semibold text-amber-600">Global Administration</h1>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <User className="mr-2 h-4 w-4" />
                                    {user?.first_name} (Super Admin)
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
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>
                    <main className="flex-1 p-6 bg-slate-50/50">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
};
