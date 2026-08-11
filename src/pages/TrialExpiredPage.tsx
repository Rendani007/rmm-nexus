import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { api } from '@/api/axios';

export const TrialExpiredPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      navigate('/login');
    } catch (e) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-lg border-red-100">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Your Free Trial Has Expired</CardTitle>
          <CardDescription className="text-base text-slate-600">
            We hope you've enjoyed your time using the RMM System! To continue accessing your dashboard and data, you will need to upgrade to one of our premium plans.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-700">
            <strong>What happens now?</strong> Don't worry, your data is completely safe and securely stored. However, your access is currently locked until an active subscription is added to your account.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button 
            className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700" 
            onClick={() => navigate('/billing')}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            View Upgrade Options
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:w-1/2 text-slate-600"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
