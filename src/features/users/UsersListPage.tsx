import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Users,
    Plus,
    Search,
    Shield,
    ShieldCheck,
    MoreHorizontal,
    UserX,
    Pencil,
    ShieldAlert,
    Loader2,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { listUsers, deleteUser, revokeSessions, type User } from '@/api/users';
import { UserFormDialog } from './UserFormDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export const UsersListPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);


    const { data, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn: () => listUsers({ q: search || undefined }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'User deactivated successfully' });
        },
        onError: (error: any) => {
            toast({ variant: 'destructive', title: 'Failed to deactivate user', description: error?.response?.data?.message || 'We encountered a problem deactivating the user. Please try again.' });
        },
    });

    const revokeSessionsMutation = useMutation({
        mutationFn: revokeSessions,
        onSuccess: () => {
            toast({ title: 'Sessions revoked successfully' });
        },
        onError: (error: any) => {
            toast({ variant: 'destructive', title: 'Failed to revoke sessions', description: error?.response?.data?.message || 'We encountered a problem revoking the sessions. Please try again.' });
        },
    });

    const confirmDeactivate = () => {
        if (!userToDeactivate) return;
        deleteMutation.mutate(userToDeactivate.id);
        setUserToDeactivate(null);
    };

    const rawData = data as any;
    const users: User[] = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.data?.data) ? rawData.data.data : []));

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Users className="h-8 w-8" />
                            User Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage users in your organization
                        </p>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Add a new user to your organization
                                </DialogDescription>
                            </DialogHeader>
                            <UserFormDialog
                                onSuccess={() => {
                                    setCreateOpen(false);
                                    queryClient.invalidateQueries({ queryKey: ['users'] });
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.first_name} {user.last_name}
                                            {user.job_title && (
                                                <span className="block text-xs text-muted-foreground">
                                                    {user.job_title}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.is_tenant_admin ? (
                                                <Badge variant="default" className="gap-1">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Admin
                                                </Badge>
                                            ) : user.roles?.some(r => r.name === 'department_admin') ? (
                                                <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Dept Admin
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    User
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.last_login_at ? (
                                                <div className="text-xs">
                                                    <span className="block font-medium">
                                                        {format(new Date(user.last_login_at), 'MMM d, HH:mm')}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {user.last_login_ip || 'No IP'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Never</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditUser(user)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {user.is_active && (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => setUserToDeactivate(user)}
                                                        >
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.is_active && (
                                                        <DropdownMenuItem
                                                            className="text-orange-600"
                                                            onClick={() => {
                                                                if (confirm(`Revoke all active sessions for ${user.first_name}? They will be forced to log in again.`)) {
                                                                    revokeSessionsMutation.mutate(user.id);
                                                                }
                                                            }}
                                                        >
                                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                                            Revoke Sessions
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit User Dialog */}
            <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information
                        </DialogDescription>
                    </DialogHeader>
                    {editUser && (
                        <UserFormDialog
                            user={editUser}
                            onSuccess={() => {
                                setEditUser(null);
                                queryClient.invalidateQueries({ queryKey: ['users'] });
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
            {/* Confirm Deactivate Dialog */}
            <AlertDialog open={!!userToDeactivate} onOpenChange={(open) => !open && setUserToDeactivate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to deactivate {userToDeactivate?.first_name} {userToDeactivate?.last_name}? 
                            They will immediately lose access to the system. You can reactivate them later by editing their profile.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeactivate} disabled={deleteMutation.isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Deactivate User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Layout>
    );
};
