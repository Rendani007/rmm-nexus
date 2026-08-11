import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Rocket, X, Check, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/api/axios';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/features/auth/useAuthStore';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  recommendedPlan?: 'professional' | 'enterprise' | 'custom';
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Upgrade your workspace", 
  description = "You've reached the limits of your current plan. Upgrade to unlock more features and scale your operations.",
  recommendedPlan = 'professional'
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const { tenant } = useAuthStore();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await api.post('/billing/checkout', {
        plan_slug: recommendedPlan
      });
      
      if (response.data?.action === 'contact_sales') {
        window.location.href = "mailto:sales@resourcemodular.com";
        onClose();
      } else if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: "We could not initiate the checkout process. Please try again."
      });
      setLoading(false);
    }
  };

  const planPrices: Record<string, string> = {
    professional: 'R799',
    enterprise: 'R1,999',
    custom: 'Custom'
  };

  const planFeatures: Record<string, string[]> = {
    professional: [
      'Advanced AI & GS1 Scanning',
      'Up to 5 Locations & 10 Users',
      'Risk & Incident Management',
      'Priority Engineering Support'
    ],
    enterprise: [
      'Unlimited Locations & Users',
      'Full API Access',
      'Custom Workflows',
      'Dedicated Account Manager'
    ],
    custom: [
      'Bespoke SLA',
      'On-Premise Deployment Options',
      'Unlimited Quotas',
      'Dedicated Support Team'
    ]
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl"
            >
              <div className="relative h-32 bg-gradient-to-br from-teal/20 via-primary/10 to-background">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full bg-background/50 p-2 backdrop-blur hover:bg-background/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute -bottom-6 left-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-teal to-primary shadow-lg">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
              </div>

              <div className="px-8 pb-8 pt-10">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
                <p className="mt-2 text-muted-foreground">{description}</p>

                {recommendedPlan === 'custom' ? (
                  <div className="mt-8 space-y-6">
                    {/* Inline Interactive Builder */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-semibold text-foreground">Users</label>
                          <span className="text-sm font-bold text-teal">20 (Example)</span>
                        </div>
                        <input type="range" min="2" max="50" defaultValue="20" className="w-full accent-teal" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-semibold text-foreground">Locations</label>
                          <span className="text-sm font-bold text-teal">5 (Example)</span>
                        </div>
                        <input type="range" min="1" max="20" defaultValue="5" className="w-full accent-teal" />
                      </div>
                    </div>
                    
                    <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4 text-center">
                      <span className="text-sm font-medium text-muted-foreground block mb-1">Estimated Total</span>
                      <span className="text-3xl font-bold tracking-tight">R2,878</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" className="w-full" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button className="w-full bg-teal hover:bg-teal/90 text-white" onClick={handleUpgrade} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Upgrade to Custom
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-8 rounded-2xl border border-teal/20 bg-teal/5 p-6 relative overflow-hidden">
                      <div className="absolute right-0 top-0 rounded-bl-xl bg-teal/20 px-3 py-1 text-xs font-semibold text-teal">
                        Recommended
                      </div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="capitalize">{recommendedPlan}</span> Plan
                      </h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight">
                            {planPrices[recommendedPlan]}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      
                      <ul className="mt-6 space-y-3">
                        {(planFeatures[recommendedPlan] || planFeatures['professional']).map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-teal" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 flex gap-4">
                      <Button variant="outline" className="w-full" onClick={onClose}>
                        Maybe Later
                      </Button>
                      <Button className="w-full bg-teal hover:bg-teal/90 text-white" onClick={handleUpgrade} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Upgrade Now
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
