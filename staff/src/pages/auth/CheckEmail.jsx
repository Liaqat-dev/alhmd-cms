import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Mail, RefreshCw, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Logo from '../../images/logo.png'

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
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(175deg, hsl(232,47%,13%) 0%, hsl(240,40%,18%) 100%)' }}>
      {/* Subtle orb */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
            <img src={Logo} alt="CGA" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CGA LMS</h1>
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Learning Management System</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center">
              <Mail className="h-9 w-9 text-blue-600" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your account needs email verification before you can log in.
              We've sent a link to:
            </p>
            {email && (
              <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mt-1">
                <span className="text-sm font-semibold text-gray-800">{email}</span>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="text-left space-y-3 bg-blue-50/60 rounded-xl p-4">
            {[
              'Open the email from CGA LMS',
              'Click the "Verify Email Address" button',
              'Return here and log in',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {sent ? (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium py-2">
                <CheckCircle className="h-4 w-4" />
                New verification email sent!
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleResend}
                disabled={resending}
              >
                {resending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                Resend verification email
              </Button>
            )}

            <Link to="/login">
              <Button variant="ghost" className="w-full gap-2 text-gray-500">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            Didn't receive it? Check your spam folder, or use the resend button above.
          </p>
        </div>
      </div>
    </div>
  )
}
