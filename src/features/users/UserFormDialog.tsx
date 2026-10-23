import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Eye, EyeOff, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { createUser, updateUser, type User, type CreateUserBody, type UpdateUserBody } from '@/api/users';
import { getDepartments, type Department } from '@/api/departments';
import { useQuery } from '@tanstack/react-query';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const createSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    send_invitation: z.boolean().default(true),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
    job_title: z.string().optional(),
    department_id: z.string().optional(),
    is_tenant_admin: z.boolean().default(false),
}).superRefine((data, ctx) => {
    if (!data.send_invitation) {
        if (!data.password || data.password.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Password must be at least 8 characters',
                path: ['password'],
            });
        }
        if (data.password !== data.password_confirmation) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Passwords don't match",
                path: ['password_confirmation'],
            });
        }
    }
});

const editSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    job_title: z.string().optional(),
    department_id: z.string().optional(),
    role: z.enum(['department_admin', 'user']).optional(),
    is_tenant_admin: z.boolean(),
    is_active: z.boolean(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface UserFormDialogProps {
    user?: User;
    onSuccess: () => void;
}

export const UserFormDialog = ({ user, onSuccess }: UserFormDialogProps) => {
    const isEdit = !!user;

    // Fetch departments
    const { data: departmentsData } = useQuery({
        queryKey: ['departments'],
        queryFn: () => getDepartments({ per_page: 100 }),
    });

    const departments: Department[] = departmentsData?.data?.data || [];

    // Determine initial role
    const getInitialRole = (u?: User): 'department_admin' | 'user' => {
        if (!u || !u.roles) return 'user';
        return u.roles.some(r => r.name === 'department_admin') ? 'department_admin' : 'user';
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<CreateFormData | EditFormData>({
        resolver: zodResolver(isEdit ? editSchema : createSchema),
        defaultValues: isEdit
            ? {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                job_title: user.job_title || '',
                department_id: user.department_id || (user.department && typeof user.department !== 'string' ? (user.department as any).id : user.department) || '',
                role: getInitialRole(user),
                is_tenant_admin: user.is_tenant_admin,
                is_active: user.is_active,
            }
            : {
                first_name: '',
                last_name: '',
                email: '',
                send_invitation: true,
                password: '',
                password_confirmation: '',
                job_title: '',
                department_id: '',
                is_tenant_admin: false,
            },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateFormData) => createUser(data as CreateUserBody),
        onSuccess: () => {
            toast({ title: 'User created successfully' });
            onSuccess();
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to create user',
                description: error?.response?.data?.error || 'Something went wrong',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: EditFormData) => updateUser(user!.id, data as UpdateUserBody),
        onSuccess: () => {
            toast({ title: 'User updated successfully' });
            onSuccess();
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to update user',
                description: error?.response?.data?.error || 'Something went wrong',
            });
        },
    });

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const onSubmit = (data: CreateFormData | EditFormData) => {
        if (isEdit) {
            updateMutation.mutate(data as EditFormData);
        } else {
            createMutation.mutate(data as CreateFormData);
        }
    };

    const [showPassword, setShowPassword] = useState(false);

    const watchedIsAdmin = watch('is_tenant_admin');
    const sendInvitation = isEdit ? false : ((watch as any)('send_invitation') ?? true);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" {...register('first_name')} disabled={isLoading} />
                    {errors.first_name && (
                        <p className="text-sm text-destructive">{errors.first_name.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" {...register('last_name')} disabled={isLoading} />
                    {errors.last_name && (
                        <p className="text-sm text-destructive">{errors.last_name.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} disabled={isLoading} />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>

            {!isEdit && (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 pr-2">
                            <Label htmlFor="send_invitation" className="font-semibold text-sm flex items-center gap-1.5 cursor-pointer">
                                <Mail className="h-4 w-4 text-primary" />
                                Send Email Invitation
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Email a secure link to the user to choose their own password.
                            </p>
                        </div>
                        <Switch
                            id="send_invitation"
                            checked={sendInvitation}
                            onCheckedChange={(checked) => (setValue as any)('send_invitation', checked)}
                            disabled={isLoading}
                        />
                    </div>

                    {sendInvitation ? (
                        <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs flex items-center gap-2 text-foreground/90">
                            <Sparkles className="h-4 w-4 text-primary shrink-0" />
                            <span>
                                An invitation email will be dispatched via Brevo SMTP with an onboarding link.
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2 border-t border-border/50">
                            <div className="space-y-2">
                                <Label htmlFor="password">Set Initial Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password' as any)}
                                        disabled={isLoading}
                                        className="pr-10"
                                        placeholder="At least 8 characters"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {(errors as any).password && (
                                    <p className="text-sm text-destructive">{(errors as any).password.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password_confirmation' as any)}
                                        disabled={isLoading}
                                        className="pr-10"
                                        placeholder="Repeat password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {(errors as any).password_confirmation && (
                                    <p className="text-sm text-destructive">
                                        {(errors as any).password_confirmation.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input id="job_title" {...register('job_title')} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department_id">Department</Label>
                    <Select
                        onValueChange={(value) => setValue('department_id', value)}
                        defaultValue={isEdit ? (user.department_id || (user.department && typeof user.department !== 'string' ? (user.department as any).id : '')) : ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Department Role Selection */}
            {watch('department_id') && !watchedIsAdmin && (
                <div className="space-y-3 rounded-lg border p-3">
                    <Label>Role within Department</Label>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="role_user"
                                value="user"
                                className="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...register('role')}
                                defaultChecked={isEdit ? !user.roles?.some(r => r.name === 'department_admin') : true}
                            />
                            <Label htmlFor="role_user" className="font-normal">General User</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="role_admin"
                                value="department_admin"
                                className="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...register('role')}
                                defaultChecked={isEdit ? user.roles?.some(r => r.name === 'department_admin') : false}
                            />
                            <Label htmlFor="role_admin" className="font-normal">Department Admin</Label>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <Label>Administrator</Label>
                    <p className="text-sm text-muted-foreground">
                        Can manage users and company settings
                    </p>
                </div>
                <Switch
                    checked={!!watchedIsAdmin}
                    onCheckedChange={(checked) => setValue('is_tenant_admin', checked)}
                    disabled={isLoading}
                />
            </div>

            {isEdit && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <Label>Active</Label>
                        <p className="text-sm text-muted-foreground">
                            User can log in and access the system
                        </p>
                    </div>
                    <Switch
                        checked={!!(watch as any)('is_active')}
                        onCheckedChange={(checked) => (setValue as any)('is_active', checked)}
                        disabled={isLoading}
                    />
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update User' : 'Create User'}
            </Button>
        </form>
    );
};
