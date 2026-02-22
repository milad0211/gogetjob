import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminActivityPage({
    searchParams,
}: {
    searchParams: Promise<{ userId?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return redirect('/dashboard')

    const params = await searchParams
    const selectedUserId = params.userId || ''

    let query = supabase
        .from('resume_generations')
        .select('id, user_id, job_source, job_url, status, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

    if (selectedUserId) {
        query = query.eq('user_id', selectedUserId)
    }

    const { data: activities } = await query
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, plan')
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    const total = (activities || []).length
    const successCount = (activities || []).filter((a) => a.status === 'success').length
    const failedCount = (activities || []).filter((a) => a.status === 'failed').length
    const urlCount = (activities || []).filter((a) => a.job_source === 'url').length

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Activity Monitoring</h1>
                <p className="text-slate-500 mt-1">Track every resume generation with user, source, status, and exact timestamp.</p>
            </header>

            <div className="grid md:grid-cols-4 gap-4">
                <MetricCard label="Events (loaded)" value={total} />
                <MetricCard label="Success" value={successCount} />
                <MetricCard label="Failed" value={failedCount} />
                <MetricCard label="From URL" value={urlCount} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">Resume Generation Events</h2>
                    {selectedUserId && (
                        <a
                            href="/admin/activity"
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                            Clear user filter
                        </a>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Created At</th>
                                <th className="px-6 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(activities || []).map((row) => {
                                const userInfo = profileMap.get(row.user_id)
                                return (
                                    <tr key={row.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{userInfo?.full_name || 'Unknown User'}</div>
                                            <div className="text-xs text-slate-500">{userInfo?.email || row.user_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${userInfo?.plan === 'pro'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                {(userInfo?.plan || 'free').toUpperCase()}
                                            </span>
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
                                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[320px] truncate">
                                            {row.error_message || row.job_url || '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                            {(activities || []).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No activity found for this filter.
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

function MetricCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
    )
}
