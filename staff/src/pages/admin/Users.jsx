import {useEffect, useState} from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {usersAPI, rolesAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import UserAvatar from '@/components/shared/UserAvatar'
import {CheckCircle2, Loader2, Search, ShieldCheck, Users as UsersIcon} from 'lucide-react'
import {PagePanel} from '@/components/shared/admin-table.jsx'

const ROLE_LABELS = {ADMIN: 'Administrator', TEACHER: 'Teacher'}

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')

    const [assignOpen, setAssignOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [selectedRoleIds, setSelectedRoleIds] = useState([])
    const [saving, setSaving] = useState(false)

    const {toast} = useToast()

    useEffect(() => {
        fetchRoles()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 250)
        return () => clearTimeout(timer)
    }, [search, filterRole])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params = {}
            if (search) params.search = search
            if (filterRole !== 'all') params.role = filterRole
            const res = await usersAPI.getAll(params)
            setUsers(res.data.users)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch users'})
        } finally {
            setLoading(false)
        }
    }

    const fetchRoles = async () => {
        try {
            const res = await rolesAPI.getAll()
            setRoles(res.data.roles)
        } catch {
            // non-fatal — assign-roles modal will just show an empty list
        }
    }

    const openAssignRoles = (user) => {
        setEditingUser(user)
        setSelectedRoleIds(user.roles.map(r => r.id))
        setAssignOpen(true)
    }

    const toggleRole = (roleId) => {
        setSelectedRoleIds(prev =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        )
    }

    const saveRoles = async () => {
        setSaving(true)
        try {
            await usersAPI.assignRoles(editingUser.id, selectedRoleIds)
            toast({title: 'Success', description: 'Roles updated successfully'})
            setAssignOpen(false)
            fetchUsers()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.errors?.roleIds || error.response?.data?.message || 'Failed to update roles',
            })
        } finally {
            setSaving(false)
        }
    }

    const getUserName = (u) => u.admin?.name || u.teacher?.name || 'Unnamed'

    return (
        <DashboardLayout title="Users">
            <div className="space-y-6">
                <PagePanel
                    icon={UsersIcon}
                    title="Users"
                    count={users.length}
                    countLabel="total users"
                >
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"/>
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name or email…"
                                className="pl-8"
                            />
                        </div>
                        <Select value={filterRole} onValueChange={setFilterRole}>
                            <SelectTrigger className="w-full xs:w-40">
                                <SelectValue placeholder="All Accounts"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Accounts</SelectItem>
                                <SelectItem value="ADMIN">Administrators</SelectItem>
                                <SelectItem value="TEACHER">Teachers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
                            <p className="text-sm text-muted-foreground">Loading users...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="font-semibold">User</TableHead>
                                    <TableHead className="font-semibold">Account Type</TableHead>
                                    <TableHead className="font-semibold">Roles</TableHead>
                                    <TableHead className="font-semibold">Verified</TableHead>
                                    <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(u => (
                                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                <UserAvatar name={getUserName(u)} profilePicUrl={u.profilePicUrl} size="sm"/>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{getUserName(u)}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/10 px-2 py-0.5 text-xs font-medium">
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[260px]">
                                                {u.roles.length === 0 ? (
                                                    <span className="text-xs text-muted-foreground">No roles assigned</span>
                                                ) : u.roles.map(r => (
                                                    <span key={r.id} className="inline-flex items-center rounded-md bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/10 px-2 py-0.5 text-xs font-medium">
                                                        {r.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {u.isVerified ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
                                            ) : (
                                                <span className="text-xs text-amber-600">Pending</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 gap-1.5 text-xs"
                                                onClick={() => openAssignRoles(u)}
                                            >
                                                <ShieldCheck className="h-3.5 w-3.5"/>
                                                Assign Roles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="rounded-full bg-muted p-3">
                                                    <UsersIcon className="h-5 w-5 text-muted-foreground"/>
                                                </div>
                                                <p className="text-sm text-muted-foreground">No users found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </PagePanel>
            </div>

            {/* Assign Roles Dialog */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg">Assign Roles</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40">
                                <UserAvatar name={getUserName(editingUser)} profilePicUrl={editingUser.profilePicUrl} size="sm"/>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{getUserName(editingUser)}</p>
                                    <p className="text-xs text-muted-foreground truncate">{editingUser.email}</p>
                                </div>
                            </div>

                            {roles.length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-dark-500 p-3 text-center rounded-lg border border-dashed border-gray-200 dark:border-dark-700">
                                    No roles exist yet. Create one from the Roles tab first.
                                </p>
                            ) : (
                                <div className="rounded-lg border border-gray-200 dark:border-dark-700 divide-y divide-gray-100 dark:divide-dark-800 max-h-64 overflow-y-auto">
                                    {roles.map(role => (
                                        <label key={role.id} className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-850 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedRoleIds.includes(role.id)}
                                                onChange={() => toggleRole(role.id)}
                                                className="mt-0.5 rounded border-gray-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-700 dark:text-dark-200">{role.name}</p>
                                                {role.description && (
                                                    <p className="text-xs text-gray-400 dark:text-dark-500">{role.description}</p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={saveRoles} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                            Save Roles
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
