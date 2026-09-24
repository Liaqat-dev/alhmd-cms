import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { authAPI, studentsAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import ProfilePicUpload from '@/components/shared/ProfilePicUpload'
import {
  User, Hash, Phone, MapPin, Key, LogOut, CalendarDays,
  GraduationCap, Loader2, Eye, EyeOff, BookOpen, IdCard,
} from 'lucide-react'

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
      </div>
    </div>
  )
}

const statusColors = {
  ENROLLED:  'bg-green-50 text-green-700 border-green-200',
  PENDING:   'bg-amber-50  text-amber-700  border-amber-200',
  PASSED_OUT: 'bg-blue-50   text-blue-700   border-blue-200',
}

const statusLabels = {
  ENROLLED:  'Enrolled',
  PENDING:   'Pending',
  PASSED_OUT: 'Passed Out',
}

export default function StudentProfile() {
  const { user, logout, logoutAll } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(true)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  const name = user?.student?.name || 'Student'
  const rollNumber = user?.student?.rollNumber || ''

  useEffect(() => {
    if (!user?.student?.id) { setLoadingDetails(false); return }
    studentsAPI.getById(user.student.id)
      .then(res => setDetails(res.data.student))
      .catch(() => {})
      .finally(() => setLoadingDetails(false))
  }, [user?.student?.id])

  const toggleShow = (field) => setShowPw(p => ({ ...p, [field]: !p[field] }))

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) {
      toast({ variant: 'destructive', title: 'Passwords do not match' }); return
    }
    if (pwForm.next.length < 8) {
      toast({ variant: 'destructive', title: 'Password must be at least 8 characters' }); return
    }
    setSaving(true)
    try {
      await authAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next })
      toast({ title: 'Password updated', description: 'You will be signed out now.' })
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => { logout(); navigate('/login') }, 1500)
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed', description: err.response?.data?.message || 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoutAll = async () => {
    setLoggingOutAll(true)
    try {
      await logoutAll()
      navigate('/login')
    } finally {
      setLoggingOutAll(false)
    }
  }

  const dob = details?.dateOfBirth
    ? new Date(details.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const joining = details?.joiningDate
    ? new Date(details.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const className = details?.class?.name || user?.student?.enrollments?.[0]?.class?.name || '—'

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-5 pb-10">

        {/* ── Profile header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-sky-400/20 via-sky-300/10 to-transparent" />
          <div className="px-6 pb-6 -mt-8 flex items-end gap-4">
            <ProfilePicUpload accentColor="sky" />
            <div className="pb-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">{name}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-semibold">
                  <GraduationCap className="h-3 w-3" /> Student
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs font-semibold">
                  <Hash className="h-3 w-3" /> {rollNumber}
                </span>
                {details?.status && (
                  <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-semibold ${statusColors[details.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {statusLabels[details.status] || details.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Personal details ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-sky-500" /> Personal Details
          </h3>

          {loadingDetails ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading details…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Full Name"      value={name}                icon={User} />
              <InfoRow label="Roll Number"    value={rollNumber}           icon={Hash} />
              <InfoRow label="Father's Name"  value={details?.fatherName}  icon={User} />
              <InfoRow label="CNIC / B-Form"  value={details?.cnic}        icon={IdCard} />
              <InfoRow label="Gender"         value={details?.gender} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date of Birth</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{dob}</p>
                </div>
              </div>
              <InfoRow label="Phone"          value={details?.phone}         icon={Phone} />
              <InfoRow label="Guardian Phone" value={details?.guardianPhone}  icon={Phone} />
              <InfoRow label="Address"        value={details?.address}        icon={MapPin} />
            </div>
          )}
        </div>

        {/* ── Academic info ──────────────────────────────────────────────── */}
        {!loadingDetails && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-500" /> Academic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Class"          value={className}                icon={GraduationCap} />
              <InfoRow label="Academic Year"  value={details?.academicYear} />
              <InfoRow label="Monthly Fee"    value={details?.monthlyFee ? `Rs. ${Number(details.monthlyFee).toLocaleString()}` : '—'} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Joining Date</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{joining}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Change password ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <Key className="h-4 w-4 text-sky-500" /> Change Password
          </h3>
          <p className="text-xs text-gray-400 mb-4">Your default password is your roll number. Change it to something secure.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { id: 'cur', field: 'current', label: 'Current Password', placeholder: 'Default: your roll number' },
              { id: 'nxt', field: 'next',    label: 'New Password',     placeholder: 'Min. 8 characters' },
              { id: 'cnf', field: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(({ id, field, label, placeholder }) => (
              <div key={id}>
                <Label htmlFor={id} className="text-xs font-medium text-gray-600">{label}</Label>
                <div className="relative mt-1">
                  <Input
                    id={id}
                    type={showPw[field] ? 'text' : 'password'}
                    value={pwForm[field]}
                    onChange={(e) => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(field)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">Updating your password will sign you out on all devices.</p>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </div>

        {/* ── Sessions ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <LogOut className="h-4 w-4 text-red-400" /> Sign Out Everywhere
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Revokes all active sessions across every device, including this one.
          </p>
          <Button variant="destructive" onClick={handleLogoutAll} disabled={loggingOutAll} className="gap-2">
            {loggingOutAll && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign out all devices
          </Button>
        </div>

      </div>
    </DashboardLayout>
  )
}
