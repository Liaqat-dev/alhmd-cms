import {useEffect, useRef, useState} from 'react'
import {useAuth} from '@/context/AuthContext'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import {cn} from '@/lib/utils'
import {Bell, ChevronDown, LogOut, Menu, Moon, Palette, Sun, User, X,} from 'lucide-react'
import {Button} from '@/components/ui/button'
import Logo from '../../images/logo.png'
import UserAvatar from '@/components/shared/UserAvatar'
import {INSTITUTE_NAME} from '@shared/config/institute'
import {PALETTES, useTheme} from '@/hooks/useTheme'

const breadcrumbMap = {
    '/': 'Dashboard',
    '/students': 'Students',
    '/teachers': 'Teachers',
    '/classes': 'Classes',
    '/subjects': 'Subjects',
    '/timetable': 'Timetable',
    '/announcements': 'Announcements',
    '/events': 'Events',
    '/fees': 'Fee Management',
    '/marks': 'Marks & Exams',
    '/salaries': 'Teacher Salaries',
    '/reports': 'Reports',
    '/profile': 'My Profile',
    '/mark-attendance': 'Mark Attendance',
    '/attendance-register': 'Attendance Register',
    '/users': 'Users',
    '/roles': 'Roles',
}

export default function Header({title, onMenuToggle, mobileMenuOpen}) {
    const {user, logout} = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [searchFocused, setSearchFocused] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [paletteOpen, setPaletteOpen] = useState(false)
    const dropdownRef = useRef(null)
    const paletteRef = useRef(null)

    const {isDark, toggleDark, palette, setPalette} = useTheme()

    const userName = user?.admin?.name || user?.teacher?.name || 'User'
    const userEmail = user?.email || ''
    const userInitial = userName.charAt(0).toUpperCase()

    const roleLabelMap = {
        ADMIN: 'Administrator',
        TEACHER: 'Teacher',
    }
    const currentPage = breadcrumbMap[location.pathname] || title

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false)
            }
            if (paletteRef.current && !paletteRef.current.contains(e.target)) {
                setPaletteOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="header-glass sticky top-0 z-50 p-2 xs:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Logo (mobile) + Breadcrumb (desktop) */}
                <div className="flex items-center gap-2.5">
                    {/* Brand — mobile only */}
                    <div className="md:hidden flex items-center">
                        <Link  to={'/'}>
                            <img src={Logo} alt={INSTITUTE_NAME} className="h-11 object-contain"/>
                        </Link>
                    </div>

                    {/* Breadcrumb + Title — desktop only */}
                    <div className="hidden md:flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="capitalize font-medium">{roleLabelMap[user?.role] || user?.role}</span>
                            {currentPage && currentPage !== 'Dashboard' && (
                                <>
                                    <span className="text-muted-foreground/40">/</span>
                                    <span className="text-foreground/70 font-medium">{currentPage}</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight mt-0.5 truncate">
                            {title || currentPage}
                        </h1>
                    </div>
                </div>

                {/* Right: Search + Controls + Profile */}
                <div className="flex items-center gap-2">

                    {/* Dark / Light toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDark}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg"
                    >
                        {isDark
                            ? <Sun className="h-4 w-4"/>
                            : <Moon className="h-4 w-4"/>
                        }
                    </Button>

                    {/* Palette Switcher*/}
                    {/*<div className="relative" ref={paletteRef}>*/}
                    {/*    <Button*/}
                    {/*        variant="ghost"*/}
                    {/*        size="icon"*/}
                    {/*        onClick={() => setPaletteOpen(o => !o)}*/}
                    {/*        title="Change color palette"*/}
                    {/*        className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg"*/}
                    {/*    >*/}
                    {/*        <Palette className="h-4 w-4"/>*/}
                    {/*        /!* Active palette dot *!/*/}
                    {/*        <span*/}
                    {/*            className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full border border-white"*/}
                    {/*            style={{backgroundColor: PALETTES.find(p => p.name === palette)?.color}}*/}
                    {/*        />*/}
                    {/*    </Button>*/}

                    {/*    {paletteOpen && (*/}
                    {/*        <div*/}
                    {/*            className="absolute right-0 mt-1.5 w-48 p-3 bg-popover border border-border/80 rounded-xl shadow-xl shadow-black/8 z-50">*/}
                    {/*            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">*/}
                    {/*                Color Palette*/}
                    {/*            </p>*/}
                    {/*            <div className="grid grid-cols-4 gap-2">*/}
                    {/*                {PALETTES.map(p => (*/}
                    {/*                    <button*/}
                    {/*                        key={p.name}*/}
                    {/*                        onClick={() => {*/}
                    {/*                            setPalette(p.name);*/}
                    {/*                            setPaletteOpen(false)*/}
                    {/*                        }}*/}
                    {/*                        title={p.label}*/}
                    {/*                        className={cn(*/}
                    {/*                            'h-7 w-7 rounded-full transition-transform duration-150 hover:scale-110',*/}
                    {/*                            palette === p.name && 'ring-2 ring-offset-2 ring-foreground/30 scale-110'*/}
                    {/*                        )}*/}
                    {/*                        style={{backgroundColor: p.color}}*/}
                    {/*                    />*/}
                    {/*                ))}*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    )}*/}
                    {/*</div>*/}

                    {/*/!* Notification Bell *!/*/}
                    {/*<Button*/}
                    {/*    variant="ghost"*/}
                    {/*    size="icon"*/}
                    {/*    className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg"*/}
                    {/*>*/}
                    {/*    <Bell className="h-4 w-4"/>*/}
                    {/*    <span*/}
                    {/*        className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 border-2 border-white"/>*/}
                    {/*</Button>*/}

                    {/* Hamburger — mobile only */}
                    <button
                        onClick={onMenuToggle}
                        className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        <div className="relative h-5 w-5">
                            <Menu className={cn(
                                'absolute inset-0 h-5 w-5 transition-all duration-200 ease-in-out',
                                mobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                            )}/>
                            <X className={cn(
                                'absolute inset-0 h-5 w-5 transition-all duration-200 ease-in-out',
                                mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                            )}/>
                        </div>
                    </button>

                    {/* Separator — desktop only */}
                    <div className="hidden md:block h-6 w-px bg-border/60 mx-0.5"/>

                    {/* User Dropdown — desktop only */}
                    <div className="relative hidden md:block" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={cn(
                                'flex items-center gap-2.5 h-9 pl-0.5 pr-1 rounded-lg transition-all duration-150',
                                'hover:bg-muted/60',
                                dropdownOpen && 'bg-muted/60'
                            )}
                        >
                            <UserAvatar name={userName} profilePicUrl={user?.profilePicUrl} size="sm" shape="rounded" className="shadow-sm" />
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-xs font-semibold text-foreground leading-tight">{userName}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                    {roleLabelMap[user?.role] || user?.role}
                                </span>
                            </div>
                            <ChevronDown className={cn(
                                'h-3 w-3 text-muted-foreground transition-transform duration-200',
                                dropdownOpen && 'rotate-180'
                            )}/>
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div
                                className="absolute right-0 mt-1.5 w-48 py-1.5 bg-popover border border-border/80 rounded-md shadow-xl shadow-black/8 animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                                <div className="px-3 py-2.5 border-b border-border/60">
                                    <p className="text-sm font-semibold text-foreground">{userName}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{userEmail}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            navigate('/profile')
                                        }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                                    >
                                        <User className="h-3.5 w-3.5 text-muted-foreground"/>
                                        Profile
                                    </button>
                                </div>
                                <div className="border-t border-border/60 pt-1">
                                    <button
                                        onClick={logout}
                                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-3.5 w-3.5"/>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
