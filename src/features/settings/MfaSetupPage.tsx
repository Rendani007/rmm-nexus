import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, ShieldAlert, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { api } from '@/api/axios';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { QRCodeSVG } from 'qrcode.react';
import { Layout } from '@/components/Layout';

const mfaEnableSchema = z.object({
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
});

const mfaDisableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type MfaEnableForm = z.infer<typeof mfaEnableSchema>;
type MfaDisableForm = z.infer<typeof mfaDisableSchema>;

export const MfaSetupPage = () => {
  const navigate = useNavigate();
  const { user, tenant, token, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled || false);
  const [setupData, setSetupData] = useState<{ secret: string; qr_code_url: string } | null>(null);

  useEffect(() => {
    if (user) {
      setMfaEnabled(user.mfa_enabled);
    }
  }, [user]);

  const { register: registerEnable, handleSubmit: handleEnableSubmit, formState: { errors: enableErrors } } = useForm<MfaEnableForm>({
    resolver: zodResolver(mfaEnableSchema),
  });

  const { register: registerDisable, handleSubmit: handleDisableSubmit, formState: { errors: disableErrors } } = useForm<MfaDisableForm>({
    resolver: zodResolver(mfaDisableSchema),
  });

  const generateMfa = async () => {
    setLoading(true);
    try {
      const response = await api.post('/mfa/generate');
      setSetupData(response.data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error generating MFA',
        description: error?.response?.data?.error || 'Failed to start setup',
      });
    } finally {
      setLoading(false);
    }
  };

  const onEnable = async (data: MfaEnableForm) => {
    setLoading(true);
    try {
      await api.post('/mfa/enable', data);
      toast({ title: 'Success', description: 'Two-Factor Authentication is now enabled!' });
      
      // Update global auth state
      if (user && tenant && token) {
        setAuth({ ...user, mfa_enabled: true }, tenant, token);
      }
      
      setSetupData(null);
      setMfaEnabled(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error?.response?.data?.error || 'Invalid code, please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onDisable = async (data: MfaDisableForm) => {
    setLoading(true);
    try {
      await api.post('/mfa/disable', data);
      toast({ title: 'Success', description: 'Two-Factor Authentication has been disabled.' });
      
      // Update global auth state
      if (user && tenant && token) {
        setAuth({ ...user, mfa_enabled: false }, tenant, token);
      }
      
      setMfaEnabled(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Disable Failed',
        description: error?.response?.data?.error || 'Incorrect password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Two-Factor Authentication</h1>
          <p className="text-muted-foreground mt-1">
            Add an extra layer of security to your account using an authenticator app.
          </p>
        </div>
      </div>

      {!mfaEnabled && !setupData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              MFA is currently Disabled
            </CardTitle>
            <CardDescription>
              We highly recommend enabling Two-Factor Authentication to protect your account from unauthorized access.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={generateMfa} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set up Authenticator App
            </Button>
          </CardFooter>
        </Card>
      )}

      {setupData && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Configure Authenticator</CardTitle>
            <CardDescription>
              Scan the QR code below with Google Authenticator, Authy, or Microsoft Authenticator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={setupData.qr_code_url} size={200} />
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium">Or enter this code manually:</p>
              <code className="bg-muted p-2 rounded text-lg tracking-widest block mt-2">{setupData.secret}</code>
            </div>

            <form onSubmit={handleEnableSubmit(onEnable)} className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="code">Enter the 6-digit code from your app to verify setup</Label>
                <Input
                  id="code"
                  placeholder="000000"
                  maxLength={6}
                  {...registerEnable('code')}
                  className="text-center text-xl tracking-widest max-w-[200px] mx-auto"
                />
                {enableErrors.code && <p className="text-sm text-destructive text-center">{enableErrors.code.message}</p>}
              </div>
              <div className="flex justify-center gap-4">
                <Button type="button" variant="outline" onClick={() => setSetupData(null)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {mfaEnabled && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              MFA is Active
            </CardTitle>
            <CardDescription>
              Your account is protected by Two-Factor Authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDisableSubmit(onDisable)} className="space-y-4 max-w-sm">
              <h3 className="font-medium text-sm text-destructive">Disable MFA</h3>
              <div className="space-y-2">
                <Label htmlFor="password">Confirm your password to disable</Label>
                <Input
                  id="password"
                  type="password"
                  {...registerDisable('password')}
                />
                {disableErrors.password && <p className="text-sm text-destructive">{disableErrors.password.message}</p>}
              </div>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disable MFA
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      </div>
    </Layout>
  );
};
