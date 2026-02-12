import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, MoreHorizontal, Pencil, Trash, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, type Department } from '@/api/departments';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const departmentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    budget_limit: z.coerce.number().min(0, 'Budget must be positive').optional(),
    currency: z.string().length(3, 'Currency must be 3 characters'),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export const DepartmentsPage = () => {
    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

    const queryClient = useQueryClient();

    const { data: departmentsData, isLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: () => getDepartments({ per_page: 100 }),
    });

    const departments = departmentsData?.data?.data || [];
    const totalBudget = departments.reduce((acc: number, d: Department) => acc + Number(d.budget_limit || 0), 0);

    const deleteMutation = useMutation({
        mutationFn: deleteDepartment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast({ title: 'Department deleted successfully' });
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Failed to delete department',
                description: error?.response?.data?.message || 'Something went wrong',
            });
        }
    });

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this department?')) {
            deleteMutation.mutate(id);
        }
    };

    const columns: ColumnDef<Department>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'description',
            header: 'Description',
        },
        {
            accessorKey: 'budget_limit',
            header: 'Budget',
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue('budget_limit') || '0');
                const currency = row.original.currency;
                return amount > 0 ? formatCurrency(amount, currency) : '-';
            },
        },
        {
            accessorKey: 'users_count',
            header: 'Users',
            cell: ({ row }) => row.original.users_count || 0,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const department = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                                setSelectedDepartment(department);
                                setIsDialogOpen(true);
                            }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(department.id)}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: departments,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting as any,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters as any,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
                        <p className="text-muted-foreground">
                            Manage company departments and budgets.
                        </p>
                    </div>
                    <Button onClick={() => { setSelectedDepartment(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{departments.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Budget (Est)</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl md:text-2xl font-bold break-all">{formatCurrency(totalBudget, 'ZAR')}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center py-4">
                    <Input
                        placeholder="Filter departments..."
                        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                        onChange={(event) =>
                            table.getColumn('name')?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>

                <DepartmentDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    department={selectedDepartment}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['departments'] });
                        setIsDialogOpen(false);
                    }}
                />
            </div>
        </Layout>
    );
};

interface DepartmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department: Department | null;
    onSuccess: () => void;
}

const DepartmentDialog = ({ open, onOpenChange, department, onSuccess }: DepartmentDialogProps) => {
    const isEdit = !!department;

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            name: '',
            description: '',
            budget_limit: 0,
            currency: 'ZAR',
        }
    });

    useQuery({
        queryKey: ['department-reset', department?.id],
        queryFn: async () => {
            if (department) {
                reset({
                    name: department.name,
                    description: department.description || '',
                    budget_limit: Number(department.budget_limit),
                    currency: department.currency,
                });
            } else {
                reset({
                    name: '',
                    description: '',
                    budget_limit: 0,
                    currency: 'ZAR',
                });
            }
            return null;
        },
        enabled: open
    });

    const mutation = useMutation({
        mutationFn: (data: DepartmentFormData) => {
            if (isEdit) return updateDepartment(department.id, data);
            return createDepartment(data);
        },
        onSuccess: () => {
            toast({ title: `Department ${isEdit ? 'updated' : 'created'} successfully` });
            onSuccess();
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error?.response?.data?.message || 'Something went wrong',
            });
        }
    });

    const onSubmit = (data: DepartmentFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Department' : 'Add Department'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" {...register('description')} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget Limit</Label>
                            <Input id="budget" type="number" step="0.01" {...register('budget_limit')} />
                            {errors.budget_limit && <p className="text-sm text-destructive">{errors.budget_limit.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" {...register('currency')} placeholder="ZAR" />
                            {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
