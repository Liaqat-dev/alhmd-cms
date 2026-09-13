import {useEffect, useMemo, useState} from 'react'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {rolesAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {Loader2, Pencil, ShieldCheck, Trash2, Users} from 'lucide-react'
import {FormField, ServerError} from '@/components/ui/form-fields'
import useAppForm from '@/hooks/useAppForm'
import {PagePanel} from '@/components/shared/admin-table.jsx'

export default function AdminRoles() {
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState(null)
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([])
    const {toast} = useToast()

    useEffect(() => {
        fetchRoles()
        fetchPermissions()
    }, [])

    const fetchRoles = async () => {
        setLoading(true)
        try {
            const res = await rolesAPI.getAll()
            setRoles(res.data.roles)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch roles'})
        } finally {
            setLoading(false)
        }
    }

    const fetchPermissions = async () => {
        try {
            const res = await rolesAPI.getAllPermissions()
            setPermissions(res.data.permissions)
        } catch {
            // non-fatal
        }
    }

    // Group permissions by category for the checklist UI
    const permissionsByCategory = useMemo(() => {
        const groups = {}
        for (const p of permissions) {
            const cat = p.category || 'Other'
            if (!groups[cat]) groups[cat] = []
            groups[cat].push(p)
        }
        return groups
    }, [permissions])

    const schema = useMemo(() => Yup.object({
        name: Yup.string().required('Role name is required'),
    }), [])

    const {formik, isSubmitting, serverError, clearServerError} = useAppForm({
        initialValues: {name: '', description: ''},
        validationSchema: schema,
        onSubmit: async (values) => {
            const payload = {...values, permissionIds: selectedPermissionIds}
            if (editingRole) {
                await rolesAPI.update(editingRole.id, payload)
                return true
            } else {
                await rolesAPI.create(payload)
                return false
            }
        },
        onSuccess: (isEdit) => {
            toast({title: 'Success', description: isEdit ? 'Role updated successfully' : 'Role created successfully'})
            setDialogOpen(false)
            fetchRoles()
        },
    })

    const togglePermission = (permId) => {
        setSelectedPermissionIds(prev =>
            prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
        )
    }

    const toggleCategory = (cat, allSelected) => {
        const ids = permissionsByCategory[cat].map(p => p.id)
        setSelectedPermissionIds(prev =>
            allSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]
        )
    }

    const handleOpenDialog = (role = null) => {
        clearServerError()
        if (role) {
            setEditingRole(role)
            setSelectedPermissionIds(role.permissions.map(p => p.id))
            formik.resetForm({values: {name: role.name, description: role.description || ''}})
        } else {
            setEditingRole(null)
            setSelectedPermissionIds([])
            formik.resetForm({values: {name: '', description: ''}})
        }
        setDialogOpen(true)
    }

    const handleDelete = async (role) => {
        if (!window.confirm(`Delete the "${role.name}" role? Users holding it will lose these permissions.`)) return
        try {
            await rolesAPI.delete(role.id)
            toast({title: 'Success', description: 'Role deleted successfully'})
            fetchRoles()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete role',
            })
        }
    }

    return (
        <DashboardLayout title="Roles">
            <div className="space-y-6">
                <PagePanel
                    icon={ShieldCheck}
                    title="Roles"
                    count={roles.length}
                    countLabel="total roles"
                    addLabel="Add Role"
                    onAdd={() => handleOpenDialog()}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
                            <p className="text-sm text-muted-foreground">Loading roles...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="font-semibold">Role</TableHead>
                                    <TableHead className="font-semibold">Permissions</TableHead>
                                    <TableHead className="font-semibold">Users</TableHead>
                                    <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map(role => (
                                    <TableRow key={role.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-3.5 w-3.5 text-violet-500"/>
                                                <div>
                                                    <p className="font-medium">{role.name}</p>
                                                    {role.description && (
                                                        <p className="text-xs text-muted-foreground">{role.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                                {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Users className="h-3.5 w-3.5"/>
                                                {role._count?.users ?? 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => handleOpenDialog(role)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-rose-50"
                                                    onClick={() => handleDelete(role)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-rose-500"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {roles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="rounded-full bg-muted p-3">
                                                    <ShieldCheck className="h-5 w-5 text-muted-foreground"/>
                                                </div>
                                                <p className="text-sm text-muted-foreground">No roles found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </PagePanel>
            </div>

            {/* Add / Edit Role Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg">{editingRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        <ServerError message={serverError} onDismiss={clearServerError}/>
                        <FormField
                            label="Role Name"
                            name="name"
                            icon={<ShieldCheck className="h-4 w-4"/>}
                            placeholder="e.g., Class Teacher"
                            value={formik.values.name}
                            error={formik.touched.name && formik.errors.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                        />
                        <FormField
                            label="Description (optional)"
                            name="description"
                            placeholder="What this role is for"
                            value={formik.values.description}
                            error={formik.touched.description && formik.errors.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-400 mb-1.5">
                                Permissions
                            </label>
                            {Object.keys(permissionsByCategory).length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-dark-500 p-3 text-center rounded-lg border border-dashed border-gray-200 dark:border-dark-700">
                                    No permissions available.
                                </p>
                            ) : (
                                <div className="rounded-lg border border-gray-200 dark:border-dark-700 divide-y divide-gray-100 dark:divide-dark-800 max-h-72 overflow-y-auto">
                                    {Object.entries(permissionsByCategory).map(([cat, perms]) => {
                                        const allSelected = perms.every(p => selectedPermissionIds.includes(p.id))
                                        return (
                                            <div key={cat} className="p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] font-semibold text-gray-600 dark:text-dark-300 uppercase tracking-wide">
                                                        {cat}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCategory(cat, allSelected)}
                                                        className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                                    >
                                                        {allSelected ? 'Clear' : 'Select all'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    {perms.map(p => (
                                                        <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissionIds.includes(p.id)}
                                                                onChange={() => togglePermission(p.id)}
                                                                className="rounded border-gray-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500"
                                                            />
                                                            <span className="text-gray-700 dark:text-dark-200">{p.description || p.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                {editingRole ? 'Update' : 'Create'} Role
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
