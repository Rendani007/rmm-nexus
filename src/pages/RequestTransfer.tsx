import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createTransferRequest, getStockBalance, getStockBalancesForItem } from "@/api/stock";
import { listItems } from "@/api/items";
import { listLocations } from "@/api/locations";
import { getDepartments } from "@/api/departments";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export const RequestTransfer = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [items, setItems] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [availableStock, setAvailableStock] = useState<number | null>(null);
    const [checkingStock, setCheckingStock] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [locationStockMap, setLocationStockMap] = useState<Record<string, number>>({});
    const [loadingLocationStock, setLoadingLocationStock] = useState(false);

    const [formData, setFormData] = useState({
        inventory_item_id: "",
        from_location_id: "",
        to_department_id: "",
        qty: 1,
        notes: ""
    });

    useEffect(() => {
        // Load items scoped to user's department
        listItems({}).then(res => setItems(res || [])).catch(console.error);

        // Load locations scoped ONLY to the user's own department (+ global)
        // This prevents showing locations the user cannot access
        const locationParams: any = {};
        if (user?.department_id && !user?.is_tenant_admin) {
            locationParams.department_id = user.department_id;
        }
        listLocations(locationParams).then(res => setLocations(res || [])).catch(console.error);

        // Load ALL other departments (exclude own)
        getDepartments({ per_page: 100 }).then(res => {
            const all = res.data?.data || res.data || [];
            setDepartments(all.filter((d: any) => d.id !== user?.department_id));
        }).catch(console.error);
    }, [user]);

    // When an item is selected, pre-fetch stock for ALL locations so we can show counts in the dropdown
    useEffect(() => {
        if (!formData.inventory_item_id || locations.length === 0) {
            setLocationStockMap({});
            return;
        }
        setLoadingLocationStock(true);
        getStockBalancesForItem(
            formData.inventory_item_id,
            locations.map((l: any) => String(l.id))
        )
            .then(map => setLocationStockMap(map))
            .catch(() => setLocationStockMap({}))
            .finally(() => setLoadingLocationStock(false));
    }, [formData.inventory_item_id, locations]);

    // Check stock whenever item + location are both selected
    useEffect(() => {
        if (!formData.inventory_item_id || !formData.from_location_id) {
            setAvailableStock(null);
            return;
        }

        setCheckingStock(true);
        getStockBalance(formData.inventory_item_id, formData.from_location_id)
            .then(bal => setAvailableStock(bal))
            .catch(() => setAvailableStock(null))
            .finally(() => setCheckingStock(false));
    }, [formData.inventory_item_id, formData.from_location_id]);

    const stockStatus = () => {
        if (availableStock === null) return null;
        if (availableStock === 0) return "empty";
        if (formData.qty > availableStock) return "insufficient";
        return "ok";
    };

    const canSubmit = stockStatus() === "ok" && formData.to_department_id && !submitting;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            await createTransferRequest(formData);
            toast({ title: "Request Sent", description: "Transfer request has been created and is pending approval." });
            navigate("/stock/approvals");
        } catch (err: any) {
            const apiError = err?.response?.data?.error
                || err?.response?.data?.message
                || "We encountered a problem creating the transfer request. Please try again.";
            toast({ variant: "destructive", title: "Transfer Failed", description: apiError });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Request Stock Transfer</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Send stock from your department to another. The receiving department must approve before stock is transferred.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6 border p-6 rounded-lg bg-card shadow-sm">

                    {/* Item */}
                    <div className="space-y-2">
                        <Label>Item to Transfer</Label>
                        <Select
                            value={formData.inventory_item_id}
                            onValueChange={v => setFormData({ ...formData, inventory_item_id: v, from_location_id: "" })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                            <SelectContent>
                                {items.map(i => (
                                    <SelectItem key={i.id} value={String(i.id)}>
                                        {i.name} {i.sku ? `(${i.sku})` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* From Location — only shows user's dept locations */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>From Location (Source)</Label>
                            {loadingLocationStock && formData.inventory_item_id && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Loading stock...
                                </span>
                            )}
                        </div>
                        {locations.length === 0 ? (
                            <p className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
                                ⚠️ No locations found for your department. Ask your admin to create one and assign it to your department first.
                            </p>
                        ) : (
                            <Select
                                value={formData.from_location_id}
                                onValueChange={v => setFormData({ ...formData, from_location_id: v })}
                                disabled={!formData.inventory_item_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={formData.inventory_item_id ? "Select location" : "Select an item first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((l: any) => {
                                        const qty = locationStockMap[String(l.id)];
                                        const hasLoaded = formData.inventory_item_id && !loadingLocationStock;
                                        return (
                                            <SelectItem key={l.id} value={String(l.id)}>
                                                <span className="flex items-center justify-between w-full gap-4">
                                                    <span>{l.name} <span className="text-muted-foreground text-xs">({l.code})</span></span>
                                                    {hasLoaded && (
                                                        <span className={`text-xs font-medium tabular-nums ${
                                                            qty > 0 ? 'text-green-600' : 'text-muted-foreground'
                                                        }`}>
                                                            {qty ?? 0} in stock
                                                        </span>
                                                    )}
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Stock availability indicator */}
                        {formData.inventory_item_id && formData.from_location_id && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                                {checkingStock ? (
                                    <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking stock...</span></>
                                ) : availableStock === null ? null
                                : availableStock === 0 ? (
                                    <><AlertCircle className="h-4 w-4 text-destructive" /><span className="text-destructive font-medium">No stock recorded at this location. Use <strong>Stock In</strong> first.</span></>
                                ) : (
                                    <><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-green-700 font-medium">{availableStock} available at this location</span></>
                                )}
                            </div>
                        )}
                    </div>

                    {/* To Department */}
                    <div className="space-y-2">
                        <Label>To Department (Destination)</Label>
                        <Select
                            value={formData.to_department_id}
                            onValueChange={v => setFormData({ ...formData, to_department_id: v })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select destination department" /></SelectTrigger>
                            <SelectContent>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                            type="number"
                            min={1}
                            max={availableStock ?? undefined}
                            value={formData.qty}
                            onChange={e => setFormData({ ...formData, qty: parseInt(e.target.value) || 1 })}
                        />
                        {stockStatus() === "insufficient" && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Quantity exceeds available stock ({availableStock} available).
                            </p>
                        )}
                        {stockStatus() === "ok" && (
                            <p className="text-xs text-muted-foreground">
                                Stock will be held in transit until the receiving department approves.
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Reason for transfer..."
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-full">Cancel</Button>
                        <Button type="submit" className="w-full" disabled={!canSubmit}>
                            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</> : "Send Request"}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};
