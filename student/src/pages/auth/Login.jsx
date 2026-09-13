import {useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {useAuth} from '@/context/AuthContext'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useToast} from '@/hooks/use-toast'
import Logo from '../../images/logo.png'
import {
    Hash,
    Lock,
    ArrowRight,
    Loader2,
    Eye,
    EyeOff,
} from 'lucide-react'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const {login} = useAuth()
    const navigate = useNavigate()
    const {toast} = useToast()

    const [formData, setFormData] = useState({rollNumber: '', password: ''})

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const user = await login(formData)

            toast({
                title: 'Login Successful',
                description: `Welcome back, ${user.student?.name}!`,
            })

            navigate('/')
        } catch (error) {
            const msg = error.response?.data?.message || 'Invalid credentials'
            toast({variant: 'destructive', title: 'Login Failed', description: msg})
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Left Panel - Branding */}
            <div
                className="hidden md:flex md:w-[380px] lg:w-[480px] xl:w-[540px] flex-col justify-between p-10 relative"
                style={{
                    background: 'linear-gradient(175deg, hsl(232, 47%, 13%) 0%, hsl(240, 40%, 18%) 100%)',
                }}
            >
                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                     style={{
                         backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                     }}
                />

                {/* Decorative gradient orbs */}
                <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"/>
                <div className="absolute bottom-32 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"/>

                {/* Logo & Brand */}
                <div className="relative z-10">

                </div>

                {/* Middle content */}
                <div className="relative z-10 -mt-8">
                    <div className={'flex gap-3 flex-row items-center'}>
                        <img src={Logo} alt="CGA" className="h-48  object-contain"/>

                        <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
                            AL-HAMD
                            <br/>
                            SCIENCE
                            <br/>
                            <span className="text-amber-400">COLLEGE</span>
                        </h2>
                    </div>
                    <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-sm">
                        A comprehensive platform to manage academics, track attendance,
                        monitor progress, and streamline communication.
                    </p>

                    {/* Feature highlights */}
                    <div className="mt-8 space-y-3">
                        {[
                            'Real-time attendance tracking',
                            'Comprehensive grade management',
                            'Timetable & event scheduling',
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-400/80"/>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"/>
                    <p className="text-[11px] text-white/30">
                        &copy; {new Date().getFullYear()} Al-hamd Science College. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-[hsl(220,20%,97%)] p-6 sm:p-10">
                <div className="w-full max-w-[420px]">
                    {/* Login Card */}
                    <div className="card bg-white shadow-sm shadow-black/[0.03] p-6">
                        <div className="flex items-center gap-3 mb-4 ">
                            <div className={'flex gap-3 flex-row items-center '}>
                                <img src={Logo} alt="CGA" className="h-24  object-contain"/>

                                <h2 className="text-xl font-bold text-pretty leading-tight tracking-tight">
                                    STUDENT
                                    <br/>
                                    <span className="text-amber-400">PORTAL</span>
                                </h2>
                            </div>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rollNumber" className="text-xs font-semibold text-foreground/70">Roll
                                    Number</Label>
                                <div className="relative">
                                    <Hash
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40"/>
                                    <Input
                                        id="rollNumber"
                                        type="text"
                                        placeholder="e.g. 0001-2026"
                                        value={formData.rollNumber}
                                        onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
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
