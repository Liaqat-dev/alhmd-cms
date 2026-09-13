import {useEffect, useState} from 'react'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {eventsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {Calendar, Loader2, MapPin, Pencil, Trash2, Users} from 'lucide-react'
import useAppForm from '@/hooks/useAppForm'
import {FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const eventSchema = Yup.object({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
    location: Yup.string(),
    startDate: Yup.string().required('Start date and time is required'),
    endDate: Yup.string(),
    audience: Yup.string().required('Audience is required'),
    isRecurring: Yup.boolean(),
    recurrence: Yup.string().when('isRecurring', {
        is: true,
        then: (schema) => schema.required('Recurrence frequency is required'),
        otherwise: (schema) => schema,
    }),
})

const initialValues = {
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    audience: '',
    isRecurring: false,
    recurrence: '',
}

export default function AdminEvents() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const {toast} = useToast()

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const response = await eventsAPI.getAll()
            setEvents(response.data.events)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch events',
            })
        } finally {
            setLoading(false)
        }
    }

    // ── Form ──────────────────────────────────────────────────────────────────────
    const {formik, isSubmitting, serverError, clearServerError} = useAppForm({
        initialValues,
        validationSchema: eventSchema,
        onSubmit: async (values) => {
            const data = {
                ...values,
                endDate: values.endDate || null,
                recurrence: values.isRecurring ? values.recurrence : null,
            }
            if (editingEvent) {
                await eventsAPI.update(editingEvent.id, data)
                return true
            } else {
                await eventsAPI.create(data)
                return false
            }
        },
        onSuccess: (isEdit) => {
            toast({
                title: 'Success',
                description: isEdit ? 'Event updated successfully' : 'Event created successfully',
            })
            setDialogOpen(false)
            fetchEvents()
        },
    })

    const handleOpenDialog = (event = null) => {
        clearServerError()
        if (event) {
            setEditingEvent(event)
            formik.resetForm({
                values: {
                    title: event.title,
                    description: event.description || '',
                    location: event.location || '',
                    startDate: event.startDate?.slice(0, 16) || '',
                    endDate: event.endDate?.slice(0, 16) || '',
                    audience: event.audience,
                    isRecurring: event.isRecurring,
                    recurrence: event.recurrence || '',
                },
            })
        } else {
            setEditingEvent(null)
            formik.resetForm({values: initialValues})
        }
        setDialogOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return
        try {
            await eventsAPI.delete(id)
            toast({title: 'Success', description: 'Event deleted successfully'})
            fetchEvents()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete event',
            })
        }
    }

    const audienceBadge = {
        STUDENTS: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10',
        TEACHERS: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/10',
        BOTH: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10',
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const isUpcoming = (dateString) => {
        return new Date(dateString) >= new Date()
    }

    return (
        <DashboardLayout title="Event Management">
            <div className="space-y-6">

                <PagePanel
                    icon={Calendar}
                    title="Events"
                    count={events.length}
                    countLabel="Total Events"
                    addLabel="New Event"
                    onAdd={() => handleOpenDialog()}>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div
                                className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
                            <p className="text-sm text-muted-foreground">Loading events...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="font-semibold">Event</TableHead>
                                    <TableHead className="font-semibold">Date &amp; Time</TableHead>
                                    <TableHead className="font-semibold">Location</TableHead>
                                    <TableHead className="font-semibold">Audience</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((event) => (
                                    <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{event.title}</p>
                                                {event.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                        {event.description}
                                                    </p>
                                                )}
                                                {event.isRecurring && (
                                                    <span
                                                        className="inline-flex items-center rounded-md bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/10 px-1.5 py-0.5 text-[10px] font-medium mt-1">
                                Recurring ({event.recurrence})
                              </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{formatDate(event.startDate)}</p>
                                                {event.endDate && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        to {formatDate(event.endDate)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {event.location && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3"/>
                                                    {event.location}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                          <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${audienceBadge[event.audience] || ''}`}>
                            {event.audience}
                          </span>
                                        </TableCell>
                                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              isUpcoming(event.startDate)
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                                  : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10'
                          }`}>
                            {isUpcoming(event.startDate) ? 'Upcoming' : 'Past'}
                          </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => handleOpenDialog(event)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-rose-50"
                                                    onClick={() => handleDelete(event.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-rose-500"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {events.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="rounded-full bg-muted p-3">
                                                    <Calendar className="h-5 w-5 text-muted-foreground"/>
                                                </div>
                                                <p className="text-sm text-muted-foreground">No events found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </PagePanel>
            </div>
            {/* Event Form Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg">{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        <ServerError message={serverError} onDismiss={clearServerError}/>
                        <FormField
                            label="Title"
                            name="title"
                            icon={<Calendar className="h-4 w-4"/>}
                            placeholder="Event title"
                            value={formik.values.title}
                            error={formik.touched.title && formik.errors.title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                        />
                        <FormField
                            label="Description"
                            name="description"
                            icon={<Calendar className="h-4 w-4"/>}
                            placeholder="Event description..."
                            value={formik.values.description}
                            error={formik.touched.description && formik.errors.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            textarea
                            rows={3}
                        />
                        <FormField
                            label="Location"
                            name="location"
                            icon={<MapPin className="h-4 w-4"/>}
                            placeholder="Event location"
                            value={formik.values.location}
                            error={formik.touched.location && formik.errors.location}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Start Date & Time"
                                name="startDate"
                                type="datetime-local"
                                icon={<Calendar className="h-4 w-4"/>}
                                value={formik.values.startDate}
                                error={formik.touched.startDate && formik.errors.startDate}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                required
                            />
                            <FormField
                                label="End Date & Time"
                                name="endDate"
                                type="datetime-local"
                                icon={<Calendar className="h-4 w-4"/>}
                                value={formik.values.endDate}
                                error={formik.touched.endDate && formik.errors.endDate}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </div>
                        <FormSelect
                            label="Audience"
                            name="audience"
                            icon={<Users className="h-4 w-4"/>}
                            placeholder="Select audience"
                            value={formik.values.audience}
                            error={formik.touched.audience && formik.errors.audience}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                            options={[
                                {value: 'STUDENTS', label: 'Students Only'},
                                {value: 'TEACHERS', label: 'Teachers Only'},
                                {value: 'BOTH', label: 'Both'},
                            ]}
                        />
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formik.values.isRecurring}
                                    onChange={(e) => formik.setFieldValue('isRecurring', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Recurring Event</span>
                            </label>
                            {formik.values.isRecurring && (
                                <Select
                                    value={formik.values.recurrence}
                                    onValueChange={(value) => formik.setFieldValue('recurrence', value)}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Frequency"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="annual">Annual</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            {formik.touched.recurrence && formik.errors.recurrence && (
                                <p className="text-xs text-red-500">{formik.errors.recurrence}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                {editingEvent ? 'Update' : 'Create'} Event
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
