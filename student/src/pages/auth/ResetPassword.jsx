import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Logo from '../../images/logo.png'
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, XCircle, ShieldAlert } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('form') // 'form' | 'success' | 'invalid'
  const [errors, setErrors] = useState({})

  // If no token in URL, treat as invalid immediately
  useEffect(() => {
    if (!token) setStatus('invalid')
  }, [token])

  const validate = () => {
    const errs = {}
    if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters.'
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await authAPI.resetPasswordWithToken({ token, newPassword })
      setStatus('success')
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'INVALID_RESET_TOKEN' || code === 'RESET_TOKEN_EXPIRED') {
        setStatus('invalid')
      } else {
        const msg = err.response?.data?.errors?.newPassword || err.response?.data?.message || 'Something went wrong. Please try again.'
        setErrors({ general: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    if (!newPassword) return null
    if (newPassword.length < 8) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' }
    if (newPassword.length < 10) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' }
    if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' }
    return { label: 'Fair', color: 'bg-yellow-400', width: 'w-3/4' }
  })()

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between p-10 relative"
        style={{ background: 'linear-gradient(175deg, hsl(232, 47%, 13%) 0%, hsl(240, 40%, 18%) 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
              <img src={Logo} alt="CGA" className="h-11 w-11 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                CGA LMS
              </h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mt-0.5">
                Learning Management System
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 -mt-8">
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Cambridge Grads
            <br />
            <span className="text-amber-400">Academy</span>
          </h2>
          <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-sm">
            Choose a strong new password. Your previous sessions will be signed out automatically for your security.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'Use at least 8 characters',
              'Mix letters, numbers and symbols',
              'All active sessions will be revoked',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400/80 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
          <p className="text-[11px] text-white/30">
            &copy; {new Date().getFullYear()} Cambridge Grads Academy. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-[hsl(220,20%,97%)] p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-11 w-11 rounded-lg bg-[hsl(232,47%,13%)] flex items-center justify-center overflow-hidden">
              <img src={Logo} alt="CGA" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">CGA LMS</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Learning Management System
              </p>
            </div>
          </div>

          {/* ── Success ── */}
          {status === 'success' && (
            <div className="rounded-2xl border bg-white shadow-sm shadow-black/[0.03] p-8 text-center">
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Password updated!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Your password has been reset. You'll be redirected to the login page in a moment.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* ── Invalid / Expired ── */}
          {status === 'invalid' && (
            <div className="rounded-2xl border bg-white shadow-sm shadow-black/[0.03] p-8 text-center">
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-rose-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Link invalid or expired</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                This password reset link is invalid or has already been used. Reset links expire after 1 hour.
              </p>
              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Request a new link
                </Link>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          )}

          {/* ── Form ── */}
          {status === 'form' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Set new password</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Choose a strong password for your account.
                </p>
              </div>

              <div className="rounded-2xl border bg-white shadow-sm shadow-black/[0.03] p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-xs font-semibold text-foreground/70">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: undefined })) }}
                        className="pl-10 pr-10 h-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Strength indicator */}
                    {strength && (
                      <div className="space-y-1">
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                      </div>
                    )}
                    {errors.newPassword && (
                      <p className="text-xs text-destructive">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs font-semibold text-foreground/70">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })) }}
                        className="pl-10 pr-10 h-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Match indicator */}
                    {confirmPassword && (
                      <div className="flex items-center gap-1.5">
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <p className="text-[11px] text-emerald-600">Passwords match</p>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                            <p className="text-[11px] text-destructive">Passwords do not match</p>
                          </>
                        )}
                      </div>
                    )}
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {errors.general && (
                    <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                      {errors.general}
                    </p>
                  )}

                  <Button type="submit" className="w-full h-10 font-semibold gap-2 mt-2" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>
              </div>

              <div className="flex justify-center mt-5">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
