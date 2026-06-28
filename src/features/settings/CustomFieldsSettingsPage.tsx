import { useState, useEffect, useCallback } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Layout } from '@/components/Layout';
import { getCustomFields, createCustomField, deleteCustomField, updateCustomField, bulkDeleteCustomFields } from '@/api/customFields';
import { getDepartments } from '@/api/departments';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { CustomFieldDefinition, CreateCustomFieldBody, CustomFieldType, Department } from '@/types';


export const CustomFieldsSettingsPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('__all__'); // Default to All Departments
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

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
                department_id: editingField.department_id || 'global',
            });
        } else {
            reset({
                entity_type: 'inventory_item',
                label: '',
                type: 'text',
                sort_order: 0,
                is_required: false,
                department_id: selectedDepartmentId === '__all__' ? 'global' : selectedDepartmentId,
            });
        }
    }, [editingField, reset, selectedDepartmentId]);

    useEffect(() => {
        if (user?.is_tenant_admin) {
            getDepartments().then((data: any) => {
                // Backend returns paginated: { status, data: { data: [...], ... } }
                const depts = data?.data?.data ?? data?.data ?? data;
                if (Array.isArray(depts)) {
                    setDepartments(depts);
                }
            }).catch(console.error);
        } else if (user?.department_id) {
            setSelectedDepartmentId(user.department_id);
        }
    }, [user]);

    const fetchFields = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            // '__all__' = All Departments → no filter → backend returns all fields
            // 'global' → filter for null department_id (shared fields)
            // any UUID → filter for that specific department
            const deptId = selectedDepartmentId === '__all__' ? undefined : selectedDepartmentId;
            const data = await getCustomFields('inventory_item', deptId);
            setFields(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load custom fields');
        } finally {
            setLoading(false);
        }
    }, [selectedDepartmentId, user]);

    useEffect(() => {
        fetchFields();
    }, [fetchFields]);

    const onSubmit = async (data: CreateCustomFieldBody) => {
        setSubmitting(true);
        
        // Use the form's specific department_id, fallback appropriately
        let finalDeptId = data.department_id;
        if (finalDeptId === 'global' || finalDeptId === '__all__') {
            finalDeptId = null;
        }
        data.department_id = finalDeptId;
        
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

    const executeDelete = async () => {
        if (!fieldToDelete) return;
        const id = fieldToDelete;
        setFieldToDelete(null); // Close dialog immediately
        
        // Optimistic UI update for smooth disappearance
        const previousFields = [...fields];
        setFields(prev => prev.filter(f => f.id !== id));

        try {
            await deleteCustomField(id);
            toast.success('Field deleted');
            // Background refetch without loading spinner
            fetchFields();
        } catch (error) {
            // Revert on failure
            setFields(previousFields);
            toast.error('Failed to delete field');
        }
    };

    const executeDeleteAll = async () => {
        setIsDeletingAll(true);
        try {
            const idsToDelete = fields.map(f => f.id);
            await bulkDeleteCustomFields(idsToDelete);
            toast.success(`Deleted ${idsToDelete.length} fields successfully.`);
            setIsDeleteAllOpen(false);
            setFields([]);
        } catch (error) {
            console.error('Failed to delete all fields:', error);
            toast.error('Failed to delete all fields.');
        } finally {
            setIsDeletingAll(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Inventory Attributes</h2>
                            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                                Define custom fields for your inventory items (e.g., Serial Number, Expiry Date).
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {user?.is_tenant_admin && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Label className="text-muted-foreground whitespace-nowrap text-sm">Manage fields for:</Label>
                                <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                                    <SelectTrigger className="w-[180px] sm:w-[200px]">
                                        <SelectValue placeholder="Select Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Departments</SelectItem>
                                        <SelectItem value="global">Global (No Department)</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button 
                            variant="destructive" 
                            onClick={() => setIsDeleteAllOpen(true)} 
                            disabled={fields.length === 0 || loading}
                            className="flex-1 sm:flex-none"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete All
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {

                            setIsDialogOpen(open);
                            if (!open) {
                                setEditingField(null);
                                reset();
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingField(null)} className="flex-1 sm:flex-none">
                                    <Plus className="mr-2 h-4 w-4" /> Add Field
                                </Button>
                            </DialogTrigger>
                        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle>{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
                                <DialogDescription>
                                    {editingField
                                        ? `Update the configuration for ${editingField.label}.`
                                        : `Add a new attribute to track for your inventory items.`}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label">Field Label</Label>
                                    <Input id="label" placeholder="e.g. Expiry Date" {...register('label', { required: true })} />
                                </div>

                                {user?.is_tenant_admin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="department_id">Scope</Label>
                                        <Select onValueChange={(val) => setValue('department_id', val)} value={watch('department_id') || 'global'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Scope" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="global">Global (All Departments)</SelectItem>
                                                {departments.map(d => (
                                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            If Global, the field appears on all items across all departments.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="type">Data Type</Label>
                                    <Select onValueChange={(val: CustomFieldType) => setValue('type', val)} value={watch('type') || 'text'}>
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
                    </div>
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
                            <div className="rounded-md border overflow-x-auto pb-4">
                                <Table className="min-w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">Label</TableHead>
                                            <TableHead className="whitespace-nowrap">Key</TableHead>
                                            <TableHead className="whitespace-nowrap">Scope</TableHead>
                                            <TableHead className="whitespace-nowrap">Type</TableHead>
                                            <TableHead className="whitespace-nowrap">Required</TableHead>
                                            <TableHead className="whitespace-nowrap">Order</TableHead>
                                            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field) => (
                                            <TableRow key={field.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {field.label}
                                                        {field.is_system && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 px-1">System</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-mono whitespace-nowrap">{field.field_key}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {field.department_id 
                                                        ? (departments.find(d => String(d.id) === field.department_id)?.name || 'Department')
                                                        : <Badge variant="outline" className="text-[10px] text-muted-foreground bg-slate-50">Global</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell className="capitalize whitespace-nowrap">{field.type}</TableCell>
                                                <TableCell className="whitespace-nowrap">{field.is_required ? 'Yes' : 'No'}</TableCell>
                                                <TableCell className="whitespace-nowrap">{field.sort_order}</TableCell>
                                                <TableCell className="text-right whitespace-nowrap">
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
                                                            onClick={() => setFieldToDelete(field.id)}
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
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Confirm Delete Dialog */}
                <AlertDialog open={!!fieldToDelete} onOpenChange={(open) => !open && setFieldToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this custom field. Any data currently stored in this field for your inventory items may be lost or rendered inaccessible. 
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Delete Field
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Confirm Delete All Dialog */}
                <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete All Attributes?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete <strong>all {fields.length}</strong> custom attributes in the current scope. Any data mapped to these attributes will be hidden or lost. This action cannot be undone. Are you absolutely sure?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={executeDeleteAll} disabled={isDeletingAll} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                {isDeletingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Yes, Delete All
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Layout>
    );
};
