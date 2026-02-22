import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, FileText, DollarSign, Settings, CalendarClock } from 'lucide-react'
import { ClientUserRow } from './_components/ClientUserRow'
import type { LucideIcon } from 'lucide-react'

export default async function AdminPage() {
    const supabase = await createClient()

    // Auth check is handled in layout, but double check doesn't hurt
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: genCount } = await supabase.from('resume_generations').select('*', { count: 'exact', head: true })
    const { count: proCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro')
    const { count: successGenCount } = await supabase
        .from('resume_generations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'success')

    const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    const { data: activityRows } = await supabase
        .from('resume_generations')
        .select('id, user_id, job_source, job_url, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, plan')

    const profileMap = new Map((allProfiles || []).map((p) => [p.id, p]))
    const userStats = new Map<string, { count: number; lastGenerationAt: string | null }>()
    for (const row of activityRows || []) {
        const existing = userStats.get(row.user_id)
        if (!existing) {
            userStats.set(row.user_id, { count: 1, lastGenerationAt: row.created_at })
            continue
        }
        existing.count += 1
    }
    const recentUsersWithStats = (recentUsers || []).map((u) => {
        const stat = userStats.get(u.id)
        return {
            ...u,
            generationCount: u.total_generations_used ?? stat?.count ?? 0,
            lastGenerationAt: stat?.lastGenerationAt || null,
        }
    })

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">System metrics and recent user activity.</p>
                </div>
                <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">
                    <Settings size={16} /> Settings
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Total Users" value={userCount || 0} color="bg-blue-500" />
                <StatCard icon={FileText} label="Total Resumes" value={genCount || 0} color="bg-purple-500" />
                <StatCard icon={DollarSign} label="Pro Subscribers" value={proCount || 0} color="bg-green-500" />
                <StatCard icon={CalendarClock} label="Successful Generations" value={successGenCount || 0} color="bg-emerald-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-900">Recent Users</h2>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">With activity summary</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Resumes</th>
                                <th className="px-6 py-3">Last Generation</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentUsersWithStats.map((u) => (
                                <ClientUserRow key={u.id} user={u} showMonitoring />
                            ))}
                            {recentUsersWithStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-900">Latest Resume Activity</h2>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Last 20 generations</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(activityRows || []).map((row) => {
                                const profileInfo = profileMap.get(row.user_id)
                                return (
                                    <tr key={row.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{profileInfo?.full_name || 'Unknown User'}</div>
                                            <div className="text-xs text-slate-500">{profileInfo?.email || row.user_id}</div>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-slate-700">{row.job_source || 'unknown'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize border ${row.status === 'success'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : row.status === 'failed'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(row.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                    </tr>
                                )
                            })}
                            {(activityRows || []).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No activity found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: LucideIcon
    label: string
    value: string | number
    color: string
}) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 transition hover:shadow-md">
            <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white shadow-lg opacity-90`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    )
}
