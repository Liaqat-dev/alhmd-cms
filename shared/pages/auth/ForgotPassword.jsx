import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Logo from '@/images/LOGO.png'
import AuthBrandPanel from '@shared/components/AuthBrandPanel'
import { INSTITUTE_NAME } from '@shared/config/institute'
import { Mail, ArrowLeft, Loader2, CheckCircle, KeyRound } from 'lucide-react'

export default function ForgotPassword({ badgeSubtitle = 'Works for Admins & Teachers' }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword({ email: email.trim() })
      setSubmitted(true)
    } catch (err) {
      const msg = err.response?.data?.errors?.email || err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <AuthBrandPanel />

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-[hsl(220,20%,97%)] p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="h-11 w-11 rounded-lg bg-[hsl(232,47%,13%)] flex items-center justify-center overflow-hidden">
              <img src={Logo} alt={INSTITUTE_NAME} className="h-9 w-9 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">{INSTITUTE_NAME}</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Science College
              </p>
            </div>
          </div>

          {submitted ? (
            /* ── Success state ── */
            <div className="rounded-2xl border bg-white shadow-sm shadow-black/[0.03] p-8 text-center">
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Check your inbox</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                If an account exists for
              </p>
              <p className="text-sm font-semibold text-foreground mb-4 break-all">{email}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                a password reset link has been sent. Check your spam folder if you don't see it within a few minutes.
              </p>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground/70">The link expires in 1 hour.</p>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Forgot password?</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <div className="rounded-2xl border bg-white shadow-sm shadow-black/[0.03] p-6">
                {/* Icon badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/30 border border-blue-200/40 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-500/10 shrink-0">
                    <KeyRound className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Account Recovery</p>
                    <p className="text-[11px] text-blue-600/70">{badgeSubtitle}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-xs font-semibold text-foreground/70">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        className="pl-10 h-10"
                        autoFocus
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-destructive mt-1">{error}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-10 font-semibold gap-2" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Reset Link
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
