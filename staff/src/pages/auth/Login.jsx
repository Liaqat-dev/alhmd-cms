import {useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {useAuth} from '@/context/AuthContext'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useToast} from '@/hooks/use-toast'
import Logo from '../../images/logo.png'
import AuthBrandPanel from '@shared/components/AuthBrandPanel'
import {
    Mail,
    Lock,
    ArrowRight,
    Loader2,
    Eye,
    EyeOff,
} from 'lucide-react'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const {login, logout} = useAuth()
    const navigate = useNavigate()
    const {toast} = useToast()

    const [formData, setFormData] = useState({email: '', password: ''})

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const user = await login(formData)

            if (user.role === 'STUDENT') {
                await logout()
                toast({
                    variant: 'destructive',
                    title: 'Login Failed',
                    description: 'Students should sign in through the student portal.',
                })
                return
            }

            toast({
                title: 'Login Successful',
                description: `Welcome back, ${user.admin?.name || user.teacher?.name}!`,
            })

            const role = user.admin ? 'admin' : 'teacher'
            navigate(`/${role}`)
        } catch (error) {
            const code = error.response?.data?.code
            const msg = error.response?.data?.message || 'Invalid credentials'

            if (code === 'EMAIL_NOT_VERIFIED') {
                navigate(`/check-email?email=${encodeURIComponent(formData.email)}`)
            } else {
                toast({variant: 'destructive', title: 'Login Failed', description: msg})
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            <AuthBrandPanel />

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-[hsl(220,20%,97%)] p-6 sm:p-10">
                <div className="w-full max-w-[420px]">
                    {/* Login Card */}
                    <div className="card bg-white shadow-sm shadow-black/[0.03] p-6">
                        <div className="flex items-center gap-3 mb-4 ">
                                <div className={'flex gap-3 flex-row items-center '}>
                                    <img src={Logo} alt="CGA" className="h-24  object-contain"/>

                                    <h2 className="text-xl font-bold text-pretty leading-tight tracking-tight">
                                        STAFF
                                        <br/>
                                        <span className="text-amber-400">PORTAL</span>
                                    </h2>
                                </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-semibold text-foreground/70">Email
                                    Address</Label>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40"/>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                        className="pl-10 h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password"
                                           className="text-xs font-semibold text-foreground/70">Password</Label>
                                    <Link to="/forgot-password"
                                          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40"/>
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                        className="pl-10 pr-10 h-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-10 font-semibold gap-2 mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="h-4 w-4"/>
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Footer for mobile */}
                    <p className="text-center text-[11px] text-muted-foreground/60 mt-6 lg:hidden">
                        &copy; {new Date().getFullYear()} Al-hamd Science College
                    </p>
                </div>
            </div>
        </div>
    )
}
