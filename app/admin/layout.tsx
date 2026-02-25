import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowUpRight, LogOut, ShieldCheck } from 'lucide-react'
import { AdminNavLinks } from './_components/AdminNavLinks'

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
        .select('is_admin, full_name, email')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        redirect('/dashboard')
    }

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'Admin'
    const displayEmail = profile?.email || user.email || ''

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <div className="mx-auto flex min-h-screen max-w-[1720px]">
                <aside className="hidden w-72 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 p-5 text-slate-200 lg:flex">
                    <Link href="/admin" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
                                A
                            </div>
                            <div>
                                <p className="text-lg font-extrabold leading-tight text-white">Admin Console</p>
                                <p className="text-xs text-slate-400">Operations and governance</p>
                            </div>
                        </div>
                    </Link>

                    <div className="mt-6">
                        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Control Center</p>
                        <AdminNavLinks />
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                        <p className="text-xs font-semibold text-slate-300">Need user perspective?</p>
                        <Link href="/dashboard" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-blue-300 hover:text-blue-200">
                            Open Product Dashboard
                            <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                                <p className="truncate text-xs text-slate-400">{displayEmail}</p>
                            </div>
                        </div>
                        <form action="/auth/signout" method="post" className="mt-3">
                            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800">
                                <LogOut size={14} />
                                Sign out
                            </button>
                        </form>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto">
                    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur lg:px-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Admin Operations</p>
                                <p className="text-xs text-slate-500">Secure controls for user lifecycle, usage, and quality monitoring.</p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                <ShieldCheck size={14} />
                                Admin session verified
                            </div>
                        </div>
                    </header>

                    <div className="p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
