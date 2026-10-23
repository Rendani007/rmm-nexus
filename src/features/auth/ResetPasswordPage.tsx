import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, CheckCircle2, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ['password_confirmation'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const tenantSlug = searchParams.get('tenant') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !email || !tenantSlug) {
      toast({
        variant: 'destructive',
        title: 'Invalid Request',
        description: 'Missing required reset security parameters. Please request a new link.',
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        token,
        email,
        tenant_slug: tenantSlug,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      setSuccess(true);
      toast({
        title: 'Password Updated',
        description: 'Your password has been reset successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Failed to reset password. The link may have expired.',
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
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {success
              ? 'Your security credentials have been updated.'
              : 'Create a new secure password for your account.'}
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
                  Invalid or Expired Link
                </p>
                <p className="text-xs text-muted-foreground">
                  This reset link is missing required verification parameters. Please request a new password reset link.
                </p>
              </div>
              <Link to="/forgot-password">
                <Button className="w-full min-h-[44px]">Request New Link</Button>
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-6 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Your password has been successfully updated. You can now sign into your workspace with your new credentials.
                </p>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => navigate(`/login?tenant=${tenantSlug}`)} 
                  className="w-full min-h-[44px] font-semibold"
                >
                  Sign In Now &rarr;
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1 text-left bg-muted/40 p-3 rounded-lg border border-border/60 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Workspace:</span>
                  <span className="font-semibold text-foreground">{tenantSlug}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account:</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]">{email}</span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="password">New Password</Label>
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
                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
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
                Save New Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
