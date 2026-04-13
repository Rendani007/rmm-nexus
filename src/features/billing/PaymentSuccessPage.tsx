import { useNavigate } from 'react-router-dom';
import { PartyPopper, ArrowRight, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';

export const PaymentSuccessPage = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-emerald-100 p-8 rounded-full shadow-inner ring-8 ring-emerald-50 text-center mx-auto">
                    <ShieldCheck className="h-24 w-24 text-emerald-600 mx-auto" />
                </div>
                
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-4">
                        Payment Successful!
                        <PartyPopper className="h-10 w-10 text-amber-500" />
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                        Thank you for your subscription. Your RMM environment has been upgraded 
                        and all features associated with your plan are now active.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
                    <Button 
                        size="lg" 
                        onClick={() => navigate('/dashboard')}
                        className="h-14 px-8 text-lg font-bold"
                    >
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => navigate('/admin/company')}
                        className="h-14 px-8 text-lg"
                    >
                        View Account Details
                    </Button>
                </div>
            </div>
        </Layout>
    );
};
