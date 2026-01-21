import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, Users, Crown, Palette } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { getCompany, updateCompany, getCompanyStats } from '@/api/company';

const companySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    admin_email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    address: z.string().optional(),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export const CompanySettingsPage = () => {
    const queryClient = useQueryClient();

    const { data: company, isLoading: companyLoading } = useQuery({
        queryKey: ['company'],
        queryFn: getCompany,
    });

    const { data: stats } = useQuery({
        queryKey: ['company-stats'],
        queryFn: getCompanyStats,
    });

    const form = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        values: {
            name: company?.name || '',
            admin_email: company?.admin_email || '',
            phone: company?.phone || '',
            address: company?.address || '',
            primary_color: company?.primary_color || '#0ea5e9',
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company'] });
            toast({ title: 'Company profile updated successfully' });
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to update company',
                description: error?.response?.data?.error || 'Something went wrong',
            });
        },
    });

    const onSubmit = (data: CompanyFormData) => {
        updateMutation.mutate(data);
    };

    if (companyLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        Company Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your organization profile and settings
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.active_users || 0} / {stats?.max_users || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active users of maximum allowed
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                            <Crown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">{stats?.plan || 'Free'}</div>
                            {stats?.on_trial && (
                                <Badge variant="secondary" className="mt-1">Trial</Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Industry</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">
                                {company?.industry?.replace('_', ' ') || 'Not set'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Company Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Company Profile</CardTitle>
                        <CardDescription>
                            Update your organization's information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company Name</Label>
                                    <Input
                                        id="name"
                                        {...form.register('name')}
                                        disabled={updateMutation.isPending}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="admin_email">Admin Email</Label>
                                    <Input
                                        id="admin_email"
                                        type="email"
                                        {...form.register('admin_email')}
                                        disabled={updateMutation.isPending}
                                    />
                                    {form.formState.errors.admin_email && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.admin_email.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        {...form.register('phone')}
                                        disabled={updateMutation.isPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="primary_color" className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        Brand Color
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="primary_color"
                                            {...form.register('primary_color')}
                                            disabled={updateMutation.isPending}
                                            className="flex-1"
                                        />
                                        <div
                                            className="h-10 w-10 rounded-md border"
                                            style={{ backgroundColor: form.watch('primary_color') || '#0ea5e9' }}
                                        />
                                    </div>
                                    {form.formState.errors.primary_color && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.primary_color.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    {...form.register('address')}
                                    disabled={updateMutation.isPending}
                                    rows={3}
                                />
                            </div>

                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Modules Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Enabled Modules</CardTitle>
                        <CardDescription>
                            Modules available for your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {company?.enabled_modules?.map((mod) => (
                                <Badge key={mod} variant="secondary" className="capitalize">
                                    {mod.replace('_', ' ')}
                                </Badge>
                            ))}
                            {(!company?.enabled_modules || company.enabled_modules.length === 0) && (
                                <p className="text-muted-foreground">No modules enabled</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};
