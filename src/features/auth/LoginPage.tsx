import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { login } from '@/api/auth';
import { useAuthStore } from './useAuthStore';
import { loginSchema } from '@/lib/validation';
import type { AuthLoginBody } from '@/types';
import { api } from '@/api/axios'; // NEW

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthLoginBody>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: AuthLoginBody) => {
    setLoading(true);
    try {
      // Auto-slugify the tenant input (e.g. "My Company" -> "my-company")
      const slug = data.tenant_slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text

      const payload = {
        ...data,
        tenant_slug: slug,
      };

      const response = await login(payload);

      // === CRITICAL: persist auth the way axios expects ===
      localStorage.setItem('auth_token', response.token);         // NEW
      localStorage.setItem('tenant', JSON.stringify(response.tenant)); // FIXED: Store full object

      // set defaults immediately so the current tab uses them
      api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`; // NEW
      api.defaults.headers.common['X-Tenant-ID'] = response.tenant.id;            // NEW

      // keep your existing store if you use it in UI
      setAuth(response.user, response.tenant, response.token);

      if (response.user.must_change_password) {
        toast({
          title: 'Password Change Required',
          description: 'Please change your password before continuing.',
        });
        navigate('/change-password');
      } else if (response.user.is_super_admin) {
        toast({ title: 'Welcome Super Admin' });
        navigate('/admin/dashboard');
      } else {
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${response.user.first_name} ${response.user.last_name}`,
        });
        navigate('/'); // or '/app'
      }
    } catch (error: any) {
      console.error("Login error details:", error); // Debug log

      // Handle both standard Laravel errors { message, errors } and custom AuthController errors { error, details }
      const mainMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Invalid credentials';
      let description = mainMessage;

      const validationErrors = error?.response?.data?.errors || error?.response?.data?.details;

      if (validationErrors) {
        // Flatten errors object into a string
        description = Object.values(validationErrors).flat().join(', ');
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">RMM System</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_slug">Tenant</Label>
              <Input id="tenant_slug" placeholder="company-slug" {...register('tenant_slug')} disabled={loading} />
              {errors.tenant_slug && <p className="text-sm text-destructive">{errors.tenant_slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" {...register('email')} disabled={loading} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="underline hover:text-primary">
                Register your business
              </Link>
            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};
