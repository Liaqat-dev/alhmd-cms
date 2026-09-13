import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout({ children, title }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[hsl(var(--background))] overflow-hidden">
            <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    title={title}
                    onMenuToggle={() => setMobileMenuOpen(o => !o)}
                    mobileMenuOpen={mobileMenuOpen}
                />
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    <div className="p-2 sm:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
