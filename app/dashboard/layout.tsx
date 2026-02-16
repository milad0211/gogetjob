import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, FileText, CreditCard, LogOut, PlusCircle } from 'lucide-react'

export default async function DashboardLayout({
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
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                        <span className="text-xl font-bold text-slate-900">ResumeAI</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                    >
                        {/* Replaced 'Dashboard' text with 'Home' and LayoutDashboard icon */}
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Home</span>
                    </Link>

                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Create</p>
                        <Link
                            href="/dashboard/generate"
                            className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition shadow-sm"
                        >
                            <PlusCircle size={20} />
                            <span className="font-bold">New Resume</span>
                        </Link>
                    </div>

                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tools</p>
                        <div className="relative group">
                            {profile?.plan === 'pro' ? (
                                <Link
                                    href="/dashboard/cover-letter"
                                    className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                                >
                                    <FileText size={20} />
                                    <span className="font-medium">Cover Letters</span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 px-4 py-3 text-slate-300 cursor-not-allowed select-none">
                                    <FileText size={20} />
                                    <span className="font-medium">Cover Letters</span>
                                    <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">PRO</span>
                                </div>
                            )}
                        </div>
                        <Link
                            href="/dashboard/billing"
                            className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                        >
                            <CreditCard size={20} />
                            <span className="font-medium">Subscription</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" />
                            ) : (
                                <span className="text-slate-500 font-bold">{user.email?.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {profile?.full_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-500 truncate capitalize">
                                {profile?.plan === 'pro' ? 'Pro Member' : 'Free Plan'}
                            </p>
                        </div>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-red-600 transition">
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
