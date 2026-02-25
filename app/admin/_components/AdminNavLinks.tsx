'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, LayoutDashboard, Users } from 'lucide-react'

const ITEMS = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/activity', label: 'Activity', icon: Activity },
]

export function AdminNavLinks() {
    const pathname = usePathname()

    return (
        <nav className="space-y-1.5">
            {ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive
                            ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/40'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <item.icon size={17} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-200'} />
                        <span>{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
