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
    const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

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

    const confirmDelete = async () => {
        if (!departmentToDelete) return;
        const id = departmentToDelete;
        setDepartmentToDelete(null); // Close dialog

        deleteMutation.mutate(id);
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
                                onClick={() => setDepartmentToDelete(department.id)}
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
            <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
                    <div className="min-w-0 w-full">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Departments</h2>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">
                            Manage company departments and budgets.
                        </p>
                    </div>
                    <Button onClick={() => { setSelectedDepartment(null); setIsDialogOpen(true); }} className="w-full sm:w-auto min-h-[44px] shrink-0">
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

                <div className="w-full sm:max-w-sm py-2">
                    <Input
                        placeholder="Filter departments..."
                        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                        onChange={(event) =>
                            table.getColumn('name')?.setFilterValue(event.target.value)
                        }
                        className="w-full"
                    />
                </div>

                {/* Mobile Cards View */}
                <div className="block md:hidden space-y-3">
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => {
                            const dept = row.original;
                            const amount = parseFloat(dept.budget_limit || '0');
                            return (
                                <div key={dept.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-base text-foreground leading-tight truncate">{dept.name}</h3>
                                            {dept.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dept.description}</p>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 -mr-1">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedDepartment(dept);
                                                    setIsDialogOpen(true);
                                                }}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDepartmentToDelete(dept.id)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                        <div>
                                            <span className="text-muted-foreground">Budget: </span>
                                            <span className="font-medium text-foreground">
                                                {amount > 0 ? formatCurrency(amount, dept.currency) : '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Users: </span>
                                            <Badge variant="secondary" className="text-xs font-semibold ml-1">
                                                {dept.users_count || 0}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                            No departments found.
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block rounded-md border overflow-x-auto">
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
                <div className="flex items-center justify-between space-x-2 py-4">
                    <span className="text-xs text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[40px] px-3"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[40px] px-3"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
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

                {/* Confirm Delete Dialog */}
                <AlertDialog open={!!departmentToDelete} onOpenChange={(open) => !open && setDepartmentToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Department</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to permanently delete this department? All associated users may lose their assignments, and stock transfers may be disrupted. 
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Delete Department
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
