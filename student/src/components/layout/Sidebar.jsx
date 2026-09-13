import {useEffect, useState} from 'react'
import {Link, useLocation} from 'react-router-dom'
import {useAuth} from '@/context/AuthContext'
import {cn} from '@/lib/utils'
import UserAvatar from '@/components/shared/UserAvatar'
import Logo from '../../images/logo.png'
import {
    Award,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    FileText,
    LayoutDashboard,
    LogOut,
    User,
} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'

const studentLinks = [
    {href: '/', label: 'Dashboard', icon: LayoutDashboard},
    {href: '/timetable', label: 'Timetable', icon: Clock},
    {href: '/fees', label: 'Fee Challans', icon: DollarSign},
    {href: '/marks', label: 'My Marks', icon: Award},
    {href: '/reports', label: 'Reports', icon: FileText},
    {href: '/profile', label: 'My Profile', icon: User},
]

const roleBadgeColors = {
    STUDENT: 'bg-sky-50     dark:bg-sky-400/15     text-sky-600     dark:text-sky-300     border-sky-200     dark:border-sky-400/20',
}

export default function Sidebar({
                                    mobileOpen = false, onClose = () => {
    }
                                }) {
    const {user, logout} = useAuth()
    const location = useLocation()
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed')
        const isPhone = window.innerWidth < 768
        return saved && !isPhone ? JSON.parse(saved) : false
    })

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed))
    }, [collapsed])

    // Close mobile menu on route change
    useEffect(() => {
        onClose()
    }, [location.pathname])

    const links = studentLinks

    const getUserName = () => {
        if (user?.student) return user.student.name
        return 'User'
    }

    const NavLink = ({link, index}) => {
        const Icon = link.icon
        const isActive = location.pathname === link.href

        const linkContent = (
            <Link
                to={link.href}
                style={{animationDelay: `${index * 25}ms`}}
                className={cn(
                    'group relative flex items-center gap-2 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg transition-all duration-150',
                    'animate-in fade-in slide-in-from-left-2 ',
                    isActive
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-semibold'
                        : 'text-gray-500 dark:text-dark-400 hover:bg-primary-500/5 focus:outline-none dark:hover:bg-primary-500/10 hover:text-primary-700 dark:hover:text-primary-300',
                    collapsed && 'justify-center px-2.5'
                )}
            >
                {/* Active left indicator bar */}
                {isActive && (
                    <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[55%] rounded-r-full bg-primary-500"/>
                )}

                {/* Icon */}
                <span className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 transition-colors duration-150',
                    isActive
                        ? 'bg-primary-500/5 dark:bg-primary-500/5 text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-dark-500 group-hover:text-primary-500 dark:group-hover:text-primary-400'
                )}>
                    <Icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2.75 : 2.20}/>
                </span>

                {/* Label */}
                {!collapsed && (
                    <span className="text-xs sm:text-sm truncate tracking-wide">
                        {link.label}
                    </span>
                )}

                {/* Active dot */}
                {isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 opacity-70"/>
                )}
            </Link>
        )

        if (collapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent
                        side="right"
                        sideOffset={12}
                        className="bg-gray-900 dark:bg-dark-700 text-white border-0 px-3 py-1.5 text-xs font-medium shadow-xl"
                    >
                        {link.label}
                    </TooltipContent>
                </Tooltip>
            )
        }

        return linkContent
    }

    const MobileNavLink = ({link}) => {
        const Icon = link.icon
        const isActive = location.pathname === link.href
        return (
            <Link
                to={link.href}
                onClick={onClose}
                className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150',
                    isActive
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-semibold'
                        : 'text-gray-600 dark:text-dark-400 hover:bg-primary-500/5 hover:text-primary-700 dark:hover:text-primary-300'
                )}
            >
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2}/>
                <span className="text-sm">{link.label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 opacity-70"/>}
            </Link>
        )
    }

    return (
        <TooltipProvider>
            {/* ── Mobile dropdown overlay ──────────────────────────── */}
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={cn(
                    'fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px] md:hidden',
                    'transition-opacity duration-300 ease-in-out',
                    mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
            />
            {/* Panel */}
            <div
                className={cn(
                    'fixed inset-x-0 top-[60px] z-40 md:hidden',
                    'bg-white dark:bg-dark-900',
                    'border-b border-gray-100 dark:border-dark-800',
                    'shadow-2xl shadow-black/10',
                    'max-h-[calc(100vh-60px)] overflow-y-auto',
                    'transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                    mobileOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-4 pointer-events-none'
                )}
            >
                <nav className="px-3 pt-3 pb-2">
                    <ul className="space-y-0.5">
                        {links.map((link, index) => (
                            <li
                                key={link.href}
                                className={cn(
                                    'transition-all duration-200 ease-out',
                                    mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                                )}
                                style={{transitionDelay: mobileOpen ? `${60 + index * 30}ms` : '0ms'}}
                            >
                                <MobileNavLink link={link}/>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div
                    className={cn(
                        'border-t border-gray-100 dark:border-dark-800 p-3',
                        'transition-all duration-200 ease-out',
                        mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                    )}
                    style={{transitionDelay: mobileOpen ? `${60 + links.length * 30}ms` : '0ms'}}
                >
                    <div
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700">
                        <UserAvatar name={getUserName()} profilePicUrl={user?.profilePicUrl} size="md"/>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 dark:text-dark-100 truncate leading-tight">
                                {getUserName()}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-dark-500 truncate mt-0.5">
                                {user?.email || user?.student?.rollNumber}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                logout()
                            }}
                            className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-md text-gray-400 dark:text-dark-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Desktop sidebar ──────────────────────────────────── */}
            <div
                className={cn(
                    'hidden md:flex flex-col h-full relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                    'bg-white dark:bg-dark-900',
                    'border-r border-gray-100 dark:border-dark-800',
                    'shadow-sm dark:shadow-none',
                    collapsed ? 'w-[72px]' : 'w-[170px] sm:w-[200px] md:w-[280px]'
                )}
            >
                {/* Collapse / Expand toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        'absolute -right-3 top-[68px] z-20',
                        'h-6 w-6 rounded-full',
                        'bg-white dark:bg-dark-800',
                        'shadow-md border border-gray-200 dark:border-dark-700',
                        'flex items-center justify-center',
                        'text-gray-400 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-100',
                        'transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none overflow-hidden'
                    )}
                >
                    {collapsed
                        ? <ChevronRight className="h-3 w-3 focus:outline-none" strokeWidth={2.5}/>
                        : <ChevronLeft className="h-3 w-3 focus:outline-none " strokeWidth={2.5}/>
                    }
                </button>

                {/* Brand header */}
                <div className={cn(
                    'relative px-4 pt-5 pb-4 transition-all duration-300',
                    ' '
                )}>
                    {/* Primary-tinted gradient behind the header */}
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-primary-500/[0.06] to-transparent dark:from-primary-500/[0.08] pointer-events-none"/>

                    <div className="relative flex items-center gap-3">
                        {/* Logo */}
                        <div className={cn(
                            'rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0',
                            'bg-primary-500/10 shadow-md shadow-primary-500/30',
                            'transition-all duration-300',
                            'h-11 w-11'
                        )}>
                            <img
                                src={Logo}
                                alt="CGA"
                                className={cn(
                                    'object-contain transition-all duration-300',
                                    'h-9 w-9'
                                )}
                            />
                        </div>

                        {/* Title + badges */}
                        {!collapsed && (
                            <div className="flex flex-col min-w-0">
                                <h1 className="font-display text-[17px] font-bold text-gray-800 dark:text-dark-50 leading-tight truncate ">
                                    CGA LMS
                                </h1>
                                {user?.role && (
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className={cn(
                                            'inline-flex items-center px-2 py-0 text-[10px] font-semibold uppercase tracking-widest rounded-full border',
                                            roleBadgeColors[user.role] || 'bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-dark-400 border-gray-200 dark:border-dark-700'
                                        )}>
                                            {user.role}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 mb-1">
                    <div
                        className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-dark-700 to-transparent"/>
                </div>

                {/* Navigation */}
                <nav className={cn(
                    'flex-1 overflow-y-auto sidebar-scroll py-2',
                    collapsed ? 'px-2' : 'px-3'
                )}>
                    <ul className="space-y-0.5">
                        {links.map((link, index) => (
                            <li key={link.href}>
                                <NavLink link={link} index={index}/>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Divider */}
                <div className={cn('mx-4', collapsed && 'mx-3')}>
                    <div
                        className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-dark-700 to-transparent"/>
                </div>

                {/* User section */}
                <div className={cn(
                    'bg-gray-50/60 dark:bg-dark-850',
                    collapsed ? 'p-2' : 'p-3'
                )}>
                    {collapsed ? (
                        <div className="flex flex-col items-center gap-1.5">
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <UserAvatar name={getUserName()} profilePicUrl={user?.profilePicUrl} size="md"
                                                className="cursor-pointer transition-transform hover:scale-105"/>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    sideOffset={12}
                                    className="bg-gray-900 dark:bg-dark-700 text-white border-0 shadow-xl"
                                >
                                    <p className="font-medium text-sm">{getUserName()}</p>
                                    <p className="text-xs text-white/50 mt-0.5">{user?.email || user?.student?.rollNumber}</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 dark:text-dark-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        onClick={logout}
                                    >
                                        <LogOut className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    sideOffset={12}
                                    className="bg-gray-900 dark:bg-dark-700 text-white border-0 shadow-xl"
                                >
                                    Sign out
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 shadow-xs">
                            <UserAvatar name={getUserName()} profilePicUrl={user?.profilePicUrl} size="md"/>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-800 dark:text-dark-100 truncate leading-tight">
                                    {getUserName()}
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-dark-500 truncate mt-0.5">
                                    {user?.email || user?.student?.rollNumber}
                                </p>
                            </div>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 flex-shrink-0 text-gray-400 dark:text-dark-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        onClick={logout}
                                    >
                                        <LogOut className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    sideOffset={8}
                                    className="bg-gray-900 dark:bg-dark-700 text-white border-0 shadow-xl"
                                >
                                    Sign out
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
