import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { acceptInvitation } from '@/api/auth';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const acceptInviteSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ['password_confirmation'],
  });

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const tenantSlug = searchParams.get('tenant') || '';

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!token || !email || !tenantSlug) {
      toast({
        variant: 'destructive',
        title: 'Invalid Link',
        description: 'Missing invitation parameters. Please request a new invite link from your admin.',
      });
      return;
    }

    setLoading(true);
    try {
      const resp = await acceptInvitation({
        token,
        email,
        tenant_slug: tenantSlug,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (resp?.token && resp?.user) {
        setAuth(resp.user, resp.token, resp.tenant);
        localStorage.setItem('last_tenant_slug', tenantSlug);
        toast({
          title: 'Welcome Aboard!',
          description: `Your account has been activated. Welcome to ${resp.tenant?.name || 'RMM'}.`,
        });
        navigate('/');
      } else {
        toast({
          title: 'Account Activated',
          description: 'Please sign in with your new password.',
        });
        navigate(`/login?tenant=${tenantSlug}`);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Could not activate account. Link may have expired.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isMissingParams = !token || !email || !tenantSlug;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-xl border-border/80">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Accept Team Invitation</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Establish your personal password to access your company workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isMissingParams ? (
            <div className="space-y-6 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Invalid Invitation Link
                </p>
                <p className="text-xs text-muted-foreground">
                  This invitation link is missing required verification parameters. Please request a new invite from your workspace administrator.
                </p>
              </div>
              <Link to="/login">
                <Button className="w-full min-h-[44px]">Go to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1 text-left bg-muted/40 p-3 rounded-lg border border-border/60 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Organization:</span>
                  <span className="font-semibold text-foreground">{tenantSlug}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Email:</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]">{email}</span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="password">Create Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    {...register('password')}
                    disabled={loading}
                    className="pr-10 min-h-[44px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    {...register('password_confirmation')}
                    disabled={loading}
                    className="pr-10 min-h-[44px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full min-h-[44px] font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate Account &amp; Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
