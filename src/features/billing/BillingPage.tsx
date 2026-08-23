import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
    CreditCard, 
    Check, 
    ShieldCheck, 
    Zap, 
    Crown,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getPlans, startCheckout, type Plan } from '@/api/billing';

export const BillingPage = () => {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const { data: plans, isLoading } = useQuery({
        queryKey: ['billing-plans'],
        queryFn: getPlans
    });

    const checkoutMutation = useMutation({
        mutationFn: startCheckout,
        onSuccess: (data) => {
            // Paystack Checkout: Redirect to the authorization URL
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast({ 
                    variant: 'destructive', 
                    title: 'Checkout Error', 
                    description: 'No checkout URL was returned by the server.' 
                });
            }
        },
        onError: () => {
            toast({ 
                variant: 'destructive', 
                title: 'Checkout Failed', 
                description: 'We could not initiate the payment. Please try again.' 
            });
        }
    });

    const handlePlanSelect = (id: string) => {
        setSelectedPlan(id);
        checkoutMutation.mutate(id);
    };

    const getIcon = (id: string) => {
        switch(id) {
            case 'starter': return <Zap className="h-6 w-6 text-blue-500" />;
            case 'professional': return <ShieldCheck className="h-6 w-6 text-emerald-500" />;
            case 'enterprise': return <Crown className="h-6 w-6 text-amber-500" />;
            default: return <CreditCard className="h-6 w-6 text-gray-500" />;
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                        RMM Subscription Plans
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose the perfect plan to scale your resource management. 
                        Lucrative features designed for efficiency and compliance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-8">
                    {plans?.map((plan: Plan) => (
                        <Card 
                            key={plan.id} 
                            className={`flex flex-col relative transition-all duration-300 hover:shadow-xl border-2 ${
                                plan.recommended ? 'border-primary scale-105 z-10' : 'border-border hover:border-muted-foreground/30'
                            }`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <Badge className="px-4 py-1.5 text-sm font-semibold rounded-full shadow-lg">
                                        Best Value
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center space-y-2">
                                <div className="mx-auto bg-muted p-3 rounded-2xl w-fit mb-2">
                                    {getIcon(plan.id)}
                                </div>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>Perfect for {plan.users} users</CardDescription>
                                <div className="pt-4 flex flex-col items-center">
                                    <div>
                                        <span className="text-4xl font-bold">R{plan.price_zar}</span>
                                        <span className="text-muted-foreground ml-1">/month</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2 bg-muted/60 px-3 py-1 rounded-full">
                                        Billed natively in ZAR
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                            <div className="mt-0.5 bg-emerald-100 text-emerald-600 rounded-full p-0.5">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button 
                                    className="w-full h-12 text-lg font-semibold"
                                    variant={plan.recommended ? 'default' : 'outline'}
                                    onClick={() => handlePlanSelect(plan.id)}
                                    disabled={checkoutMutation.isPending && selectedPlan === plan.id}
                                >
                                    {checkoutMutation.isPending && selectedPlan === plan.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Zap className="mr-2 h-4 w-4" />
                                    )}
                                    Get Started
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-12 bg-muted/50 rounded-3xl p-8 border border-dashed border-muted-foreground/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Secure Payments by Paystack
                            </h3>
                            <p className="text-muted-foreground max-w-md">
                                Your payment information is encrypted and processed securely. 
                                We support common African payment methods and credit cards.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                            <span>VISA</span>
                            <span>MasterCard</span>
                            <span>Instant EFT</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
