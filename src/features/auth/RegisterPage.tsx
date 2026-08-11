import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { registerBusiness } from '@/api/auth';
import { api } from '@/api/axios';
import { useAuthStore } from './useAuthStore';
import { registerBusinessSchema } from '@/lib/validation';
import { z } from 'zod';

const US_INDUSTRIES = [
    { value: 'mining', label: 'Mining' },
    { value: 'oil_gas', label: 'Oil & Gas' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'construction', label: 'Construction' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'financial_services', label: 'Financial Services' },
    { value: 'other', label: 'Other' },
];

type RegisterBusinessForm = z.infer<typeof registerBusinessSchema>;

export const RegisterPage = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [customIndustry, setCustomIndustry] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterBusinessForm>({
        resolver: zodResolver(registerBusinessSchema),
    });

    const onSubmit = async (data: RegisterBusinessForm) => {
        setLoading(true);
        try {
            const payload = { ...data };
            if (payload.industry === 'other') {
                payload.industry = customIndustry;
            }
            const response = await registerBusiness(payload);

            // Persist auth
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('tenant', JSON.stringify(response.tenant)); // FIXED: Store full object

            api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
            api.defaults.headers.common['X-Tenant-Slug'] = response.tenant.slug;

            setAuth(response.user, response.tenant, response.token);

            toast({
                title: 'Registration Successful',
                description: `Welcome to RMM, ${response.user.first_name}! Your business account is ready.`,
            });

            // Check if they came from the marketing site with a plan selection
            const params = new URLSearchParams(window.location.search);
            const plan = params.get('plan');
            
            if (plan) {
                try {
                    const checkoutPayload: any = { plan_slug: plan };
                    
                    if (plan === 'custom') {
                        checkoutPayload.users = parseInt(params.get('users') || '0', 10);
                        checkoutPayload.locations = parseInt(params.get('locations') || '0', 10);
                        checkoutPayload.api_access = params.get('api_access') === 'true';
                        checkoutPayload.advanced_scanning = params.get('advanced_scanning') === 'true';
                        checkoutPayload.risk_management = params.get('risk_management') === 'true';
                    }
                    
                    toast({
                        title: 'Redirecting to Checkout...',
                        description: 'Please wait while we set up your secure payment session.',
                    });

                    const checkoutRes = await api.post('/billing/checkout', checkoutPayload);
                    
                    if (checkoutRes.data?.url) {
                        window.location.href = checkoutRes.data.url;
                        return; // Stop execution, browser is redirecting
                    }
                } catch (checkoutError) {
                    toast({
                        variant: 'destructive',
                        title: 'Checkout Initialization Failed',
                        description: 'Could not start payment. Please go to Settings > Billing in your dashboard to complete your subscription.',
                    });
                }
            }

            navigate('/');
        } catch (error: any) {
            // Handle "Email already exists" or generic errors
            const mainMessage = error?.response?.data?.message || error?.response?.data?.error || 'Could not register business';
            let description = mainMessage;

            const validationErrors = error?.response?.data?.errors || error?.response?.data?.details;
            if (validationErrors) {
                description = Object.values(validationErrors).flat().join(', ');
            }

            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: description,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4 py-8">
            <Card className="w-full max-w-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Login
                        </Button>
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg">
                            <img src="/app-icon.png" alt="RMM Logo" className="h-full w-full object-cover" />
                        </div>
                        <div className="w-[100px]"></div> {/* Spacer for centering logo */}
                    </div>
                    <CardTitle className="text-2xl text-center">Register Your Business</CardTitle>
                    <CardDescription className="text-center">
                        Create a new tenant account and get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input id="company_name" placeholder="Acme Corp" {...register('company_name')} disabled={loading} />
                                {errors.company_name && <p className="text-sm text-destructive">{errors.company_name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select onValueChange={(val) => { setValue('industry', val); setSelectedIndustry(val); }} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {US_INDUSTRIES.map((ind) => (
                                            <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedIndustry === 'other' && (
                                    <Input 
                                        placeholder="Type your industry" 
                                        value={customIndustry} 
                                        onChange={(e) => setCustomIndustry(e.target.value)} 
                                        disabled={loading} 
                                        className="mt-2"
                                    />
                                )}
                                {errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="admin_first_name">First Name</Label>
                                <Input id="admin_first_name" placeholder="John" {...register('admin_first_name')} disabled={loading} />
                                {errors.admin_first_name && <p className="text-sm text-destructive">{errors.admin_first_name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="admin_last_name">Last Name</Label>
                                <Input id="admin_last_name" placeholder="Doe" {...register('admin_last_name')} disabled={loading} />
                                {errors.admin_last_name && <p className="text-sm text-destructive">{errors.admin_last_name.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin_job_title">Job Title (Optional)</Label>
                            <Input id="admin_job_title" placeholder="CEO / IT Manager" {...register('admin_job_title')} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin_email">Work Email</Label>
                            <Input id="admin_email" type="email" placeholder="admin@company.com" {...register('admin_email')} disabled={loading} />
                            {errors.admin_email && <p className="text-sm text-destructive">{errors.admin_email.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        {...register('password_confirmation')}
                                        disabled={loading}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password_confirmation && <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-start space-x-2 mt-4">
                            <Checkbox 
                                id="terms" 
                                checked={acceptedTerms}
                                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                                disabled={loading}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Accept terms and conditions
                                </label>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    By registering, you agree to our{' '}
                                    <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Terms of Service</a>,{' '}
                                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Privacy Policy</a>, and{' '}
                                    <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Refund Policy</a>.
                                </p>
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={loading || !acceptedTerms}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Business Account
                        </Button>

                        <div className="text-center text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="underline hover:text-primary">
                                Sign in here
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
