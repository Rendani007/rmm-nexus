import { useState } from 'react';
import { CreditCard, Rocket, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { api } from '@/api/axios';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function BillingPage() {
  const { tenant } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Check trial status
  const trialEndsAt = tenant?.trial_ends_at ? parseISO(tenant.trial_ends_at) : null;
  const isTrialActive = trialEndsAt ? trialEndsAt > new Date() : false;
  const daysLeft = trialEndsAt ? formatDistanceToNow(trialEndsAt) : '0 days';

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      // Create a Paystack checkout session for the current plan
      const response = await api.post('/billing/checkout', {
        plan_slug: tenant?.plan || 'professional'
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not open the billing portal. Please contact support."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your current plan, payment methods, and usage limits.</p>
      </div>

      {isTrialActive && (
        <div className="flex items-center gap-4 rounded-xl border border-teal/20 bg-teal/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/20">
            <Clock className="h-6 w-6 text-teal" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">You are currently on a 30-Day Free Trial</h3>
            <p className="text-sm text-muted-foreground">
              Your trial of the {tenant?.plan || 'Professional'} plan ends in {daysLeft}. No credit card is required until the trial ends.
            </p>
          </div>
          <Button onClick={handleManageBilling} className="bg-teal text-white hover:bg-teal/90">
            Upgrade Now
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold capitalize">
                {tenant?.plan || 'Professional'}
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                  Active
                </span>
              </h2>
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {[
              'Advanced AI Scanning',
              'Up to 10 Users',
              'Up to 5 Locations',
              'Priority Support'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {feature}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button variant="outline" className="w-full" onClick={handleManageBilling} disabled={loading}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          </div>
        </div>

        {/* Usage Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">Plan Usage</h3>
          <p className="text-sm text-muted-foreground mt-1">You are well within your plan limits.</p>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-foreground">Locations</span>
                <span className="text-muted-foreground">{tenant?.plan === 'custom' || tenant?.plan === 'enterprise' ? 'Unlimited' : '1 / 5'}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: tenant?.plan === 'custom' || tenant?.plan === 'enterprise' ? '100%' : '20%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-foreground">Users</span>
                <span className="text-muted-foreground">{tenant?.plan === 'custom' || tenant?.plan === 'enterprise' ? 'Unlimited' : '3 / 10'}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: tenant?.plan === 'custom' || tenant?.plan === 'enterprise' ? '100%' : '30%' }} />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-600/90 dark:text-amber-500/90">
              Need more capacity? Upgrade to the Enterprise plan or contact us for a Custom setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
