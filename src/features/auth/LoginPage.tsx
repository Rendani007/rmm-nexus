import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { login, verifyMfa } from '@/api/auth';
import { useAuthStore } from './useAuthStore';
import { loginSchema } from '@/lib/validation';
import type { AuthLoginBody, AuthLoginResp } from '@/types';
import { api } from '@/api/axios';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<AuthLoginBody>({
    resolver: zodResolver(loginSchema),
  });

  const handleSuccessfulAuth = (response: AuthLoginResp & { mfa_required?: boolean; mfa_token?: string }) => {
    if (response.mfa_required && response.mfa_token) {
      setMfaRequired(true);
      setMfaToken(response.mfa_token);
      
      // Temporarily set the MFA token so the verify-mfa call has authorization
      api.defaults.headers.common['Authorization'] = `Bearer ${response.mfa_token}`;
      toast({ title: 'MFA Code Required', description: 'Please enter the 6-digit code from your authenticator app.' });
      return;
    }

    // === CRITICAL: persist auth the way axios expects ===
    localStorage.setItem('auth_token', response.token!);
    localStorage.setItem('tenant', JSON.stringify(response.tenant));

    // set defaults immediately so the current tab uses them
    api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
    api.defaults.headers.common['X-Tenant-ID'] = response.tenant!.id;

    // keep your existing store if you use it in UI
    setAuth(response.user!, response.tenant!, response.token!);

    if (response.user!.must_change_password) {
      toast({
        title: 'Password Change Required',
        description: 'Please change your password before continuing.',
      });
      navigate('/change-password');
    } else if (response.user!.is_super_admin) {
      toast({ title: 'Welcome Super Admin' });
      navigate('/admin/dashboard');
    } else {
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${response.user!.first_name} ${response.user!.last_name}`,
      });
      navigate('/');
    }
  };

  const onSubmit = async (data: AuthLoginBody) => {
    setLoading(true);
    try {
      const slug = data.tenant_slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

      const payload = { ...data, tenant_slug: slug };
      const response = await login(payload);
      handleSuccessfulAuth(response);

    } catch (error: any) {
      console.error("Login error details:", error);
      const mainMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Invalid credentials';
      let description = mainMessage;
      const validationErrors = error?.response?.data?.errors || error?.response?.data?.details;

      if (validationErrors) {
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

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid code', description: 'Code must be 6 digits' });
      return;
    }

    setLoading(true);
    try {
      const response = await verifyMfa({ code: mfaCode });
      handleSuccessfulAuth(response);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'MFA Failed',
        description: error?.response?.data?.error || 'Invalid code',
      });
    } finally {
      setLoading(false);
    }
  };

  if (mfaRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <ShieldCheck className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-center">
              Please enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onMfaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  className="text-center text-2xl tracking-widest h-14"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading || mfaCode.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => { setMfaRequired(false); setMfaCode(''); }}>
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
