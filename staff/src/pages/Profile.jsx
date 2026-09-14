import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { authAPI, teachersAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import ProfilePicUpload from '@/components/shared/ProfilePicUpload'
import {
  User, Mail, Phone, MapPin, Shield, Key, LogOut, CheckCircle,
  CalendarDays, Loader2, Eye, EyeOff, Users,
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

// Shared account-management page (password change, sign-out-everywhere) for
// both admins and teachers. The account-details section and accent color
// differ by role; everything else is identical.
export default function Profile() {
  const { user, isTeacher, logout, logoutAll } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(isTeacher)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  const name = isTeacher ? (user?.teacher?.name || 'Teacher') : (user?.admin?.name || 'Admin')
  const email = user?.email || ''
  // Tailwind's scanner needs literal class strings, not interpolated ones —
  // these can't be built with a template literal, so full strings per role.
  const accent = isTeacher
    ? { headerBar: 'h-20 bg-gradient-to-r from-emerald-400/20 via-emerald-300/10 to-transparent', icon: 'text-emerald-500' }
    : { headerBar: 'h-20 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-transparent', icon: 'text-amber-500' }

  useEffect(() => {
    if (!isTeacher || !user?.teacher?.id) { setLoadingDetails(false); return }
    teachersAPI.getById(user.teacher.id)
      .then(res => setDetails(res.data))
      .catch(() => {})
      .finally(() => setLoadingDetails(false))
  }, [isTeacher, user?.teacher?.id])

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

  const joiningDate = details?.teacher?.joiningDate
    ? new Date(details.teacher.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-5 pb-10">

        {/* ── Profile header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={accent.headerBar} />
          <div className="px-6 pb-6 -mt-8 flex items-end gap-4">
            <ProfilePicUpload accentColor={isTeacher ? 'emerald' : 'amber'} />
            <div className="pb-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">{name}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {isTeacher ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    <Users className="h-3 w-3" /> Teacher
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                    <Shield className="h-3 w-3" /> Administrator
                  </span>
                )}
                {user?.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                    {isTeacher ? 'Email not verified' : 'Not verified'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Account details ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className={`text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2`}>
            <User className={`h-4 w-4 ${accent.icon}`} /> Account Details
          </h3>

          {loadingDetails ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading details…
            </div>
          ) : isTeacher ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Full Name" value={name} icon={User} />
              <InfoRow label="Email Address" value={email} icon={Mail} />
              <InfoRow label="Phone" value={details?.teacher?.phone} icon={Phone} />
              <InfoRow label="Address" value={details?.teacher?.address} icon={MapPin} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Joining Date</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{joiningDate}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Account Created</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{createdAt}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Full Name" value={name} />
              <InfoRow label="Email Address" value={email} />
              <InfoRow label="Role" value="Administrator" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Member Since</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{createdAt}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Assigned classes summary (teacher only) ───────────────────── */}
        {isTeacher && !loadingDetails && details?.classes?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" /> Assigned Classes
            </h3>
            <div className="flex flex-wrap gap-2">
              {details.classes.map((ct) => (
                <span
                  key={ct.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold"
                >
                  {ct.class?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Change password ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Key className={`h-4 w-4 ${accent.icon}`} /> Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { id: 'cur', field: 'current', label: 'Current Password', placeholder: 'Enter current password' },
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
