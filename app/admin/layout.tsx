import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Users, LogOut, ShieldCheck } from 'lucide-react'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        redirect('/dashboard')
    }

    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <Link href="/admin" className="flex items-center gap-2 text-white">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold">A</div>
                        <span className="text-xl font-bold">Admin Panel</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-white bg-slate-800 rounded-xl transition hover:bg-slate-700"
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Overview</span>
                    </Link>
                    <Link
                        href="/admin/users"
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    >
                        <Users size={20} />
                        <span className="font-medium">Users</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-red-200 text-xs font-bold">
                            AD
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Administrator</p>
                            <p className="text-xs text-slate-500">Super User</p>
                        </div>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white transition">
                        <LogOut size={16} />
                        <span>Exit to App</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}
