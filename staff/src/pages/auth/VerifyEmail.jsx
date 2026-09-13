import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [status, setStatus] = useState('verifying') // verifying | success | error | expired
  const [message, setMessage] = useState('')

  // Resend form
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please use the link from your email.')
      return
    }

    authAPI
      .verifyEmail(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.data.message || 'Email verified successfully.')
      })
      .catch((err) => {
        const code = err.response?.data?.code
        const msg = err.response?.data?.message || 'Verification failed.'
        if (code === 'TOKEN_EXPIRED') {
          setStatus('expired')
        } else {
          setStatus('error')
        }
        setMessage(msg)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async (e) => {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResending(true)
    try {
      await authAPI.resendVerification(resendEmail.trim())
      setResendDone(true)
      toast({ title: 'Verification email sent', description: 'Check your inbox.' })
    } catch {
      toast({ title: 'Failed to resend', description: 'Try again later.', variant: 'destructive' })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 space-y-6">
        {/* Verifying */}
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-gray-600 text-sm">Verifying your email address…</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <h1 className="text-xl font-semibold text-gray-900">Email Verified!</h1>
            <p className="text-gray-600 text-sm">{message}</p>
            <Button className="w-full mt-2" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        )}

        {/* Already verified (also shows success-like) */}
        {status === 'error' && !message.includes('expired') && (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-14 w-14 text-red-500" />
            <h1 className="text-xl font-semibold text-gray-900">Verification Failed</h1>
            <p className="text-gray-600 text-sm">{message}</p>

            {!resendDone ? (
              <form onSubmit={handleResend} className="w-full space-y-3 mt-2">
                <Label htmlFor="resend-email" className="text-left block">
                  Request a new link
                </Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="outline" className="w-full" disabled={resending}>
                  {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Resend Verification Email
                </Button>
              </form>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                A new link has been sent. Check your inbox.
              </p>
            )}

            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Back to login
            </Link>
          </div>
        )}

        {/* Expired */}
        {status === 'expired' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Mail className="h-14 w-14 text-yellow-500" />
            <h1 className="text-xl font-semibold text-gray-900">Link Expired</h1>
            <p className="text-gray-600 text-sm">{message}</p>

            {!resendDone ? (
              <form onSubmit={handleResend} className="w-full space-y-3 mt-2">
                <Label htmlFor="resend-email-exp" className="text-left block">
                  Enter your email to get a new link
                </Label>
                <Input
                  id="resend-email-exp"
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={resending}>
                  {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Send New Verification Email
                </Button>
              </form>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                A new link has been sent. Check your inbox.
              </p>
            )}

            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
