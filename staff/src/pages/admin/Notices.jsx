import { useState, useEffect } from 'react'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { announcementsAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Loader2, Megaphone, Pencil, Plus, Trash2, Eye, EyeOff, Users } from 'lucide-react'
import useAppForm from '@/hooks/useAppForm'
import { FormDate, FormField, FormSelect, ServerError } from '@/components/ui/form-fields'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const announcementSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  content: Yup.string().required('Content is required'),
  audience: Yup.string().required('Audience is required'),
  priority: Yup.string().required('Priority is required'),
  expiresAt: Yup.string(),
})

const initialValues = {
  title: '',
  content: '',
  audience: '',
  priority: 'NORMAL',
  expiresAt: '',
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementsAPI.getAll()
      setAnnouncements(response.data.announcements)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch announcements',
      })
    } finally {
      setLoading(false)
    }
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  const { formik, isSubmitting, serverError, clearServerError } = useAppForm({
    initialValues,
    validationSchema: announcementSchema,
    onSubmit: async (values) => {
      const data = { ...values, expiresAt: values.expiresAt || null }
      if (editingAnnouncement) {
        await announcementsAPI.update(editingAnnouncement.id, data)
        return true
      } else {
        await announcementsAPI.create(data)
        return false
      }
    },
    onSuccess: (isEdit) => {
      toast({
        title: 'Success',
        description: isEdit ? 'Announcement updated successfully' : 'Announcement created successfully',
      })
      setDialogOpen(false)
      fetchAnnouncements()
    },
  })

  const handleOpenDialog = (announcement = null) => {
    clearServerError()
    if (announcement) {
      setEditingAnnouncement(announcement)
      formik.resetForm({
        values: {
          title: announcement.title,
          content: announcement.content,
          audience: announcement.audience,
          priority: announcement.priority,
          expiresAt: announcement.expiresAt?.split('T')[0] || '',
        },
      })
    } else {
      setEditingAnnouncement(null)
      formik.resetForm({ values: initialValues })
    }
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return
    try {
      await announcementsAPI.delete(id)
      toast({ title: 'Success', description: 'Announcement deleted successfully' })
      fetchAnnouncements()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete announcement',
      })
    }
  }

  const handleToggle = async (id) => {
    try {
      await announcementsAPI.toggle(id)
      toast({ title: 'Success', description: 'Announcement status updated' })
      fetchAnnouncements()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to toggle announcement status',
      })
    }
  }

  const priorityBadge = {
    URGENT: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/10',
    NORMAL: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/10',
    INFORMATIONAL: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10',
  }

  const audienceBadge = {
    STUDENTS: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10',
    TEACHERS: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/10',
    BOTH: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10',
  }

  return (
    <DashboardLayout title="Announcement Management">
      <div className="space-y-6">
        <PagePanel
            icon={Megaphone}
            title={'Announcement'}
            iconBg="bg-primary-500/10 dark:bg-primary-500/15"
            iconColor="text-primary-600 dark:text-primary-400"
            count={announcements.length}
            countLabel={"Total announcements"}
            addLabel={'Announce'}
            onAdd={() => handleOpenDialog()}

        >
          {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
                <p className="text-sm text-muted-foreground">Loading announcements...</p>
              </div>
          ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Audience</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Published</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                      <TableRow key={announcement.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-medium">{announcement.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {announcement.content}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${audienceBadge[announcement.audience] || ''}`}>
                            {announcement.audience}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityBadge[announcement.priority] || ''}`}>
                            {announcement.priority}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(announcement.publishedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              announcement.isActive
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                                  : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10'
                          }`}>
                            {announcement.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={() => handleToggle(announcement.id)}
                                title={announcement.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {announcement.isActive ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                  <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={() => handleOpenDialog(announcement)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-rose-50"
                                onClick={() => handleDelete(announcement.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                  ))}
                  {announcements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="rounded-full bg-muted p-3">
                              <Megaphone className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">No announcements found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
          )}
        </PagePanel>
      </div>

      {/* Announcement Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <ServerError message={serverError} onDismiss={clearServerError} />
            <FormField
              label="Title"
              name="title"
              icon={<Megaphone className="h-4 w-4" />}
              placeholder="Announcement title"
              value={formik.values.title}
              error={formik.touched.title && formik.errors.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
            />
            <FormField
              label="Content"
              name="content"
              icon={<Megaphone className="h-4 w-4" />}
              placeholder="Announcement content..."
              value={formik.values.content}
              error={formik.touched.content && formik.errors.content}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              textarea
              rows={4}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Audience"
                name="audience"
                icon={<Users className="h-4 w-4" />}
                placeholder="Select audience"
                value={formik.values.audience}
                error={formik.touched.audience && formik.errors.audience}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                options={[
                  { value: 'STUDENTS', label: 'Students Only' },
                  { value: 'TEACHERS', label: 'Teachers Only' },
                  { value: 'BOTH', label: 'Both' },
                ]}
              />
              <FormSelect
                label="Priority"
                name="priority"
                icon={<Megaphone className="h-4 w-4" />}
                placeholder="Select priority"
                value={formik.values.priority}
                error={formik.touched.priority && formik.errors.priority}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                options={[
                  { value: 'URGENT', label: 'Urgent' },
                  { value: 'NORMAL', label: 'Normal' },
                  { value: 'INFORMATIONAL', label: 'Informational' },
                ]}
              />
            </div>
            <FormDate
              label="Expires On (Optional)"
              name="expiresAt"
              icon={<Calendar className="h-4 w-4" />}
              value={formik.values.expiresAt}
              error={formik.touched.expiresAt && formik.errors.expiresAt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
