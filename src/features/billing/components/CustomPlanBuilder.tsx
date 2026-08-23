import { useState, useEffect } from "react";
import { Check, Calculator, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { startCheckout, CheckoutPayload } from "@/api/billing";
import { toast } from "@/hooks/use-toast";

export const CustomPlanBuilder = () => {
    const [users, setUsers] = useState(2);
    const [locations, setLocations] = useState(1);
    const [apiAccess, setApiAccess] = useState(false);
    const [advancedScanning, setAdvancedScanning] = useState(false);
    const [riskManagement, setRiskManagement] = useState(false);
    const [price, setPrice] = useState(299);

    useEffect(() => {
        let total = 299; // Base Price
        if (users > 2) total += (users - 2) * 99;
        if (locations > 1) total += (locations - 1) * 199;
        if (apiAccess) total += 399;
        if (advancedScanning) total += 299;
        if (riskManagement) total += 199;
        setPrice(total);
    }, [users, locations, apiAccess, advancedScanning, riskManagement]);

    const checkoutMutation = useMutation({
        mutationFn: startCheckout,
        onSuccess: (data) => {
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Checkout Error',
                    description: 'No checkout URL returned.'
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

    const handleCheckout = () => {
        const payload: CheckoutPayload = {
            plan_slug: 'custom',
            max_users: users,
            max_locations: locations,
            advanced_scanning: advancedScanning,
            risk_management: riskManagement,
            api_access: apiAccess
        };
        checkoutMutation.mutate(payload);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto mt-16 border-2 border-primary/20 bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="text-center space-y-4 pb-8">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Calculator className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Build Your Custom Plan</CardTitle>
                <CardDescription className="text-lg">
                    Tailor RMM System exactly to your business needs. Pay only for what you use.
                </CardDescription>
            </CardHeader>

            <CardContent className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    {/* Users Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">Max Users</Label>
                            <span className="text-lg font-bold text-primary">{users}</span>
                        </div>
                        <Slider
                            value={[users]}
                            onValueChange={(val) => setUsers(val[0])}
                            min={2}
                            max={100}
                            step={1}
                            className="py-4"
                        />
                        <p className="text-sm text-muted-foreground">2 included, +R99 per extra user</p>
                    </div>

                    {/* Locations Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">Max Locations</Label>
                            <span className="text-lg font-bold text-primary">{locations}</span>
                        </div>
                        <Slider
                            value={[locations]}
                            onValueChange={(val) => setLocations(val[0])}
                            min={1}
                            max={50}
                            step={1}
                            className="py-4"
                        />
                        <p className="text-sm text-muted-foreground">1 included, +R199 per extra location</p>
                    </div>
                </div>

                <div className="space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg border-b pb-4">Premium Add-ons</h3>
                    
                    {/* Advanced Scanning */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label className="text-base">Advanced GS1 & AI Scanning</Label>
                            <p className="text-sm text-muted-foreground">+R299/month</p>
                        </div>
                        <Switch
                            checked={advancedScanning}
                            onCheckedChange={setAdvancedScanning}
                        />
                    </div>

                    {/* Risk Management */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label className="text-base">Risk & Incident Management</Label>
                            <p className="text-sm text-muted-foreground">+R199/month</p>
                        </div>
                        <Switch
                            checked={riskManagement}
                            onCheckedChange={setRiskManagement}
                        />
                    </div>

                    {/* API Access */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label className="text-base">Developer API Access</Label>
                            <p className="text-sm text-muted-foreground">+R399/month</p>
                        </div>
                        <Switch
                            checked={apiAccess}
                            onCheckedChange={setApiAccess}
                        />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-8 bg-muted/50 border-t rounded-b-xl gap-4">
                <div className="flex flex-col items-center sm:items-start">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Monthly Price</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-foreground">R{price}</span>
                        <span className="text-muted-foreground font-medium">/mo</span>
                    </div>
                </div>
                
                <Button 
                    size="lg" 
                    className="w-full sm:w-auto h-14 px-8 text-lg rounded-full shadow-lg"
                    onClick={handleCheckout}
                    disabled={checkoutMutation.isPending}
                >
                    {checkoutMutation.isPending ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Zap className="mr-2 h-5 w-5" />
                    )}
                    Checkout Custom Plan
                </Button>
            </CardFooter>
        </Card>
    );
};
