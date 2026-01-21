import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Layout } from '@/components/Layout';
import { getCustomFields, createCustomField, deleteCustomField, updateCustomField } from '@/api/customFields';
import type { CustomFieldDefinition, CreateCustomFieldBody, CustomFieldType } from '@/types';

export const CustomFieldsSettingsPage = () => {
    const navigate = useNavigate(); // Added hook
    const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);

    const { register, handleSubmit, reset, setValue, watch } = useForm<CreateCustomFieldBody>({
        defaultValues: {
            entity_type: 'inventory_item',
            type: 'text',
            sort_order: 0,
            is_required: false,
        }
    });

    useEffect(() => {
        if (editingField) {
            reset({
                entity_type: editingField.entity_type,
                label: editingField.label,
                type: editingField.type,
                sort_order: editingField.sort_order,
                is_required: editingField.is_required,
            });
        } else {
            reset({
                entity_type: 'inventory_item',
                label: '',
                type: 'text',
                sort_order: 0,
                is_required: false,
            });
        }
    }, [editingField, reset]);

    const fetchFields = async () => {
        try {
            const data = await getCustomFields('inventory_item');
            setFields(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load custom fields');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFields();
    }, []);

    const onSubmit = async (data: CreateCustomFieldBody) => {
        setSubmitting(true);
        try {
            if (editingField) {
                await updateCustomField(editingField.id, data);
                toast.success('Field updated');
            } else {
                await createCustomField(data);
                toast.success('Custom field created');
            }
            setIsDialogOpen(false);
            setEditingField(null);
            reset();
            fetchFields();
        } catch (error: any) {
            toast.error(editingField ? 'Failed to update field' : 'Failed to create field');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this field? Data stored in this field may be lost.')) return;
        try {
            await deleteCustomField(id);
            toast.success('Field deleted');
            fetchFields();
        } catch (error) {
            toast.error('Failed to delete field');
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Inventory Attributes</h2>
                            <p className="text-muted-foreground">
                                Define custom fields for your inventory items (e.g., Serial Number, Expiry Date).
                            </p>
                        </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                            setEditingField(null);
                            reset();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingField(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Field
                            </Button>
                        </DialogTrigger>
                        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle>{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
                                <DialogDescription>
                                    {editingField
                                        ? `Update the configuration for ${editingField.label}.`
                                        : 'Add a new attribute to track for your inventory items.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label">Field Label</Label>
                                    <Input id="label" placeholder="e.g. Expiry Date" {...register('label', { required: true })} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Data Type</Label>
                                    <Select onValueChange={(val: CustomFieldType) => setValue('type', val)} defaultValue="text">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="boolean">Yes/No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input id="sort_order" type="number" {...register('sort_order', { valueAsNumber: true })} />
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="is_required"
                                        checked={watch('is_required')}
                                        onCheckedChange={(val) => setValue('is_required', val)}
                                    />
                                    <Label htmlFor="is_required">Required Field</Label>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingField ? 'Update Field' : 'Save Field'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Defined Fields</CardTitle>
                        <CardDescription>These fields will appear on the inventory item form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                        ) : fields.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">No custom fields defined yet.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Order</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {field.label}
                                                    {field.is_system && (
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1">System</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm font-mono">{field.field_key}</TableCell>
                                            <TableCell className="capitalize">{field.type}</TableCell>
                                            <TableCell>{field.is_required ? 'Yes' : 'No'}</TableCell>
                                            <TableCell>{field.sort_order}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        setEditingField(field);
                                                        setIsDialogOpen(true);
                                                    }}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(field.id)}
                                                        disabled={field.is_system}
                                                        className="text-destructive hover:text-destructive disabled:opacity-30"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};
