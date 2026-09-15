import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Mail, RefreshCw, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Logo from '@/images/logo.png'
import AuthBrandPanel from '@shared/components/AuthBrandPanel'
import { INSTITUTE_NAME } from '@shared/config/institute'

export default function CheckEmail() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const { toast } = useToast()

  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    try {
      await authAPI.resendVerification(email)
      setSent(true)
      toast({ title: 'Verification email sent', description: 'A new link has been sent to your inbox.' })
    } catch {
      toast({ variant: 'destructive', title: 'Could not resend', description: 'Please try again in a moment.' })
    } finally {
      setResending(false)
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

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Your account needs email verification before you can log in.
            </p>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm shadow-black/[0.03] p-6">
            {/* Icon badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/30 border border-blue-200/40 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-500/10 shrink-0">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-900">Verification link sent</p>
                {email && <p className="text-[11px] text-blue-600/70 truncate">{email}</p>}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-5">
              {[
                `Open the email from ${INSTITUTE_NAME}`,
                'Click the "Verify Email Address" button',
                'Return here and log in',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/80">{step}</p>
                </div>
              ))}
            </div>

            {/* Resend */}
            {sent ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium py-2.5">
                <CheckCircle className="h-4 w-4" />
                New verification email sent!
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 font-semibold gap-2"
                onClick={handleResend}
                disabled={resending}
              >
                {resending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                Resend verification email
              </Button>
            )}

            <p className="text-xs text-muted-foreground/70 text-center mt-4">
              Didn't receive it? Check your spam folder, or use the resend button above.
            </p>
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
        </div>
      </div>
    </div>
  )
}
