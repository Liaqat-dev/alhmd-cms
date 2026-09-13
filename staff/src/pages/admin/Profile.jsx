import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import ProfilePicUpload from '@/components/shared/ProfilePicUpload'
import {
  User, Mail, Shield, Key, LogOut, CheckCircle, CalendarDays, Loader2, Eye, EyeOff,
} from 'lucide-react'

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function AdminProfile() {
  const { user, logout, logoutAll } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const name = user?.admin?.name || 'Admin'
  const email = user?.email || ''
  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [loggingOutAll, setLoggingOutAll] = useState(false)

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

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-5 pb-10">

        {/* ── Profile header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-transparent" />
          <div className="px-6 pb-6 -mt-8 flex items-end gap-4">
            <ProfilePicUpload accentColor="amber" />
            <div className="pb-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">{name}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                  <Shield className="h-3 w-3" /> Administrator
                </span>
                {user?.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                    Not verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Account details ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" /> Account Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow label="Full Name" value={name} />
            <InfoRow label="Email Address" value={email} />
            <InfoRow label="Role" value="Administrator" />
            <div className="flex items-start gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Member Since</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{createdAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Change password ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-500" /> Change Password
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
