import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransferRequest } from "@/api/stock";
import { listItems } from "@/api/items"; // I see strict scope applies, so this only lists MY items
import { listLocations } from "@/api/locations";
import { getDepartments } from "@/api/departments";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/useAuthStore";

export const RequestTransfer = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [items, setItems] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        inventory_item_id: "",
        from_location_id: "",
        to_department_id: "",
        qty: 1,
        notes: ""
    });

    useEffect(() => {
        // Load dependencies
        listItems({}).then(res => setItems(res || [])).catch(console.error);
        listLocations({}).then(res => setLocations(res || [])).catch(console.error);

        getDepartments({ per_page: 50 }).then(res => {
            // Filter out my own department?
            const all = res.data?.data || [];
            setDepartments(all.filter((d: any) => d.id !== user?.department_id));
        }).catch(console.error);
    }, [user]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTransferRequest(formData);
            toast({ title: "Request Sent", description: "Transfer request created successfully." });
            navigate("/dashboard");
        } catch (err: any) {
            console.error(err);
            toast({ variant: "destructive", title: "Error", description: "Failed to create request." });
        }
    };

    return (
        <Layout>
            <div className="max-w-xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Request Stock Transfer</h1>
                    <p className="text-gray-500">Send stock from your department to another.</p>
                </div>

                <form onSubmit={submit} className="space-y-6 border p-6 rounded-lg bg-white shadow-sm">

                    <div className="space-y-2">
                        <Label>Item to Transfer</Label>
                        <Select value={formData.inventory_item_id} onValueChange={v => setFormData({ ...formData, inventory_item_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                            <SelectContent>
                                {items.map(i => (
                                    <SelectItem key={i.id} value={i.id}>{i.name} ({i.stock_on_hand ?? 0})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>From Location (Source)</Label>
                        <Select value={formData.from_location_id} onValueChange={v => setFormData({ ...formData, from_location_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                            <SelectContent>
                                {locations.map(l => (
                                    <SelectItem key={l.id} value={l.id}>{l.name} ({l.code})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>To Department (Destination)</Label>
                        <Select value={formData.to_department_id} onValueChange={v => setFormData({ ...formData, to_department_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select destination department" /></SelectTrigger>
                            <SelectContent>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" min={1} value={formData.qty} onChange={e => setFormData({ ...formData, qty: parseInt(e.target.value) })} />
                        <p className="text-xs text-gray-500">Stock will be deducted from your location immediately.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Reason for transfer..." />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-full">Cancel</Button>
                        <Button type="submit" className="w-full">Send Request</Button>
                    </div>

                </form>
            </div>
        </Layout>
    );
};
