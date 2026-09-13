import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Logo from '../../images/logo.png'
import { Mail, ArrowLeft, Loader2, CheckCircle, KeyRound } from 'lucide-react'

export default function ForgotPassword() {
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
      {/* Left Panel — Branding (matches Login.jsx exactly) */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between p-10 relative"
        style={{ background: 'linear-gradient(175deg, hsl(232, 47%, 13%) 0%, hsl(240, 40%, 18%) 100%)' }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Logo */}
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

        {/* Middle content */}
        <div className="relative z-10 -mt-8">
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Cambridge Grads
            <br />
            <span className="text-amber-400">Academy</span>
          </h2>
          <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-sm">
            Secure account recovery. We'll send a one-time reset link to your registered email address.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'One-time secure reset link',
              'Link expires in 1 hour',
              'Your old password stays until you reset',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400/80 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
                    <p className="text-[11px] text-blue-600/70">For students</p>
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
