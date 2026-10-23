import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { forgotPassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, MailCheck, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  tenant_slug: z.string().min(1, 'Workspace identifier is required'),
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const defaultTenant = searchParams.get('tenant') || localStorage.getItem('last_tenant_slug') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      tenant_slug: defaultTenant,
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const slug = data.tenant_slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

      await forgotPassword({
        email: data.email,
        tenant_slug: slug,
      });

      setSentEmail(data.email);
      setSubmitted(true);
      toast({
        title: 'Reset Link Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Could not process password reset request.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-xl border-border/80">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password?</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {submitted 
              ? 'A secure password reset link has been dispatched to your email.'
              : 'Enter your company workspace slug and account email to receive a recovery link.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="space-y-6 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <MailCheck className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  If an account exists for <span className="font-semibold text-foreground">{sentEmail}</span>, you will receive an email shortly with a secure reset link.
                </p>
                <p className="text-xs text-muted-foreground/80 pt-2">
                  Please check your spam or promotions folder if you don't see it within 2 minutes.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" className="w-full min-h-[44px]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="tenant_slug" className="text-sm font-medium">Workspace Identifier (Slug)</Label>
                <Input
                  id="tenant_slug"
                  placeholder="e.g. apex-industrial"
                  {...register('tenant_slug')}
                  disabled={loading}
                  className="min-h-[44px]"
                />
                {errors.tenant_slug && (
                  <p className="text-xs text-destructive">{errors.tenant_slug.message}</p>
                )}
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-sm font-medium">Work Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  disabled={loading}
                  className="min-h-[44px]"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full min-h-[44px] font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-h-[44px] px-2"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
