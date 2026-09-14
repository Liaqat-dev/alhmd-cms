import Logo from '@/images/logo.png'
import { INSTITUTE_NAME } from '@shared/config/institute'

const FEATURES = [
    'Real-time attendance tracking',
    'Comprehensive grade management',
    'Timetable & event scheduling',
]

// Decorative left-hand branding panel shared by every full-page auth screen
// (Login, Forgot Password, Reset Password) in both the staff and student
// portals. Intentionally static — the brand identity should look identical
// everywhere a user can land before signing in.
export default function AuthBrandPanel() {
    return (
        <div
            className="hidden md:flex md:w-[380px] lg:w-[480px] xl:w-[540px] flex-col justify-between p-10 relative"
            style={{
                background: 'linear-gradient(175deg, hsl(232, 47%, 13%) 0%, hsl(240, 40%, 18%) 100%)',
            }}
        >
            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Decorative gradient orbs */}
            <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-32 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

            {/* Logo & Brand (reserved spacer to keep the middle content vertically balanced) */}
            <div className="relative z-10" />

            {/* Middle content */}
            <div className="relative z-10 -mt-8">
                <div className="flex gap-3 flex-row items-center">
                    <img src={Logo} alt={INSTITUTE_NAME} className="h-48 object-contain" />
                    <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
                        AL-HAMD
                        <br />
                        SCIENCE
                        <br />
                        <span className="text-amber-400">COLLEGE</span>
                    </h2>
                </div>
                <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-sm">
                    A comprehensive platform to manage academics, track attendance,
                    monitor progress, and streamline communication.
                </p>

                <div className="mt-8 space-y-3">
                    {FEATURES.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                            {feature}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                <p className="text-[11px] text-white/30">
                    &copy; {new Date().getFullYear()} {INSTITUTE_NAME}. All rights reserved.
                </p>
            </div>
        </div>
    )
}
