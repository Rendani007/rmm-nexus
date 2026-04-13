import { useNavigate } from 'react-router-dom';
import { XCircle, RefreshCcw, HelpCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';

export const PaymentCancelPage = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-red-100 p-8 rounded-full shadow-inner ring-8 ring-red-50 text-center mx-auto">
                    <XCircle className="h-24 w-24 text-red-600 mx-auto" />
                </div>
                
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Payment Cancelled
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                        The payment process was interrupted or cancelled. No charges were made to your account.
                        If you experienced technical difficulties, please reach out to our support team.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
                    <Button 
                        size="lg" 
                        onClick={() => navigate('/billing')}
                        className="h-14 px-8 text-lg"
                    >
                        Try Again
                        <RefreshCcw className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-14 px-8 text-lg"
                    >
                        <HelpCircle className="mr-2 h-5 w-5" />
                        Contact Support
                    </Button>
                </div>
            </div>
        </Layout>
    );
};
