import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, Filter, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatJobHost, resolveJobTargetLabel } from '@/lib/job-target'

type ActivitySearchParams = Promise<{
    userId?: string
    status?: string
    source?: string
    window?: string
    q?: string
    limit?: string
}>

type ActivityRow = {
    id: string
    user_id: string
    job_source: string | null
    job_url: string | null
    job_text: string | null
    status: string
    error_message: string | null
    analysis_json: unknown
    created_at: string
}

type ProfileSummary = {
    id: string
    full_name: string | null
    email: string
    plan: 'free' | 'pro'
}

type ScoreSummary = {
    before: number | null
    after: number | null
    delta: number | null
}

function normalizeScore(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return Math.max(0, Math.min(100, Math.round(value)))
}

function extractScoreSummary(analysis: unknown): ScoreSummary {
    if (!analysis || typeof analysis !== 'object') return { before: null, after: null, delta: null }
    const raw = analysis as Record<string, unknown>
    const beforeObj = raw.beforeScore && typeof raw.beforeScore === 'object'
        ? raw.beforeScore as Record<string, unknown>
        : null
    const afterObj = raw.afterScore && typeof raw.afterScore === 'object'
        ? raw.afterScore as Record<string, unknown>
        : null
    const before = normalizeScore(beforeObj?.total)
    const after = normalizeScore(afterObj?.total)
    return {
        before,
        after,
        delta: before !== null && after !== null ? after - before : null,
    }
}

function toDateString(value: string): string {
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function clampLimit(value: string | undefined): number {
    const parsed = Number.parseInt(value || '', 10)
    if (!Number.isFinite(parsed)) return 200
    return Math.max(50, Math.min(500, parsed))
}

export default async function AdminActivityPage({
    searchParams,
}: {
    searchParams: ActivitySearchParams
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return redirect('/dashboard')

    const params = await searchParams
    const selectedUserId = params.userId || ''
    const statusFilter = params.status || 'all'
    const sourceFilter = params.source || 'all'
    const windowFilter = params.window || '7d'
    const queryText = (params.q || '').trim().toLowerCase()
    const limit = clampLimit(params.limit)

    let sinceIso: string | null = null
    const nowDate = new Date()
    const nowMs = nowDate.getTime()
    if (windowFilter === '24h') sinceIso = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString()
    if (windowFilter === '7d') sinceIso = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString()
    if (windowFilter === '30d') sinceIso = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString()
    if (windowFilter === '90d') sinceIso = new Date(nowMs - 90 * 24 * 60 * 60 * 1000).toISOString()

    let eventsQuery = supabase
        .from('resume_generations')
        .select('id, user_id, job_source, job_url, job_text, status, error_message, analysis_json, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (selectedUserId) eventsQuery = eventsQuery.eq('user_id', selectedUserId)
    if (statusFilter !== 'all') eventsQuery = eventsQuery.eq('status', statusFilter)
    if (sourceFilter !== 'all') eventsQuery = eventsQuery.eq('job_source', sourceFilter)
    if (sinceIso) eventsQuery = eventsQuery.gte('created_at', sinceIso)

    const [{ data: events }, { data: filterUsers }] = await Promise.all([
        eventsQuery,
        supabase
            .from('profiles')
            .select('id, full_name, email, plan')
            .order('created_at', { ascending: false })
            .limit(300),
    ])

    const eventsTyped = (events || []) as ActivityRow[]
    const eventUserIds = Array.from(new Set(eventsTyped.map((row) => row.user_id)))
    const missingUserIds = eventUserIds.filter((id) => !(filterUsers || []).some((u) => u.id === id))
    const { data: missingProfiles } = missingUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, email, plan')
            .in('id', missingUserIds)
        : { data: [] as ProfileSummary[] }

    const profileMap = new Map<string, ProfileSummary>()
    for (const p of filterUsers || []) {
        profileMap.set(p.id, p)
    }
    for (const p of missingProfiles || []) {
        profileMap.set(p.id, p)
    }

    const normalizedRows = eventsTyped
        .map((row) => {
            const userInfo = profileMap.get(row.user_id)
            const score = extractScoreSummary(row.analysis_json)
            const jobTarget = resolveJobTargetLabel({
                jobText: row.job_text,
                jobUrl: row.job_url,
                analysis: row.analysis_json,
                fallbackLabel: 'Role context',
            })

            return {
                ...row,
                userInfo,
                score,
                jobTarget,
                host: formatJobHost(row.job_url),
            }
        })
        .filter((row) => {
            if (!queryText) return true
            const haystack = [
                row.userInfo?.full_name || '',
                row.userInfo?.email || '',
                row.user_id,
                row.jobTarget,
                row.error_message || '',
                row.host || '',
            ].join(' ').toLowerCase()
            return haystack.includes(queryText)
        })

    const total = normalizedRows.length
    const successCount = normalizedRows.filter((row) => row.status === 'success').length
    const failedCount = normalizedRows.filter((row) => row.status === 'failed').length
    const failedRate = total > 0 ? (failedCount / total) * 100 : 0
    const uniqueUsers = new Set(normalizedRows.map((row) => row.user_id)).size
    const scoreRows = normalizedRows.filter((row) => row.score.after !== null)
    const avgAfterScore = scoreRows.length > 0
        ? Math.round(scoreRows.reduce((sum, row) => sum + (row.score.after || 0), 0) / scoreRows.length)
        : 0

    return (
        <div className="space-y-6">
            <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Activity monitoring</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Investigate generation quality, failure reasons, and user-level behavior from one searchable feed.
                </p>
            </header>

            <section className="grid gap-4 md:grid-cols-5">
                <MetricCard label="Events loaded" value={total} />
                <MetricCard label="Success" value={successCount} />
                <MetricCard label="Failed" value={failedCount} />
                <MetricCard label="Unique users" value={uniqueUsers} />
                <MetricCard label="Avg after score" value={avgAfterScore} suffix="%" />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <form className="grid gap-3 lg:grid-cols-6">
                    <label className="relative lg:col-span-2">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            name="q"
                            defaultValue={params.q || ''}
                            placeholder="Search user, error, target, host"
                            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                    </label>

                    <select name="userId" defaultValue={selectedUserId} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">All users</option>
                        {(filterUsers || []).map((u) => (
                            <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                        ))}
                    </select>

                    <select name="status" defaultValue={statusFilter} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="all">All status</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                    </select>

                    <select name="source" defaultValue={sourceFilter} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="all">All sources</option>
                        <option value="url">URL</option>
                        <option value="paste">Paste</option>
                        <option value="text">Text</option>
                    </select>

                    <select name="window" defaultValue={windowFilter} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="24h">Last 24h</option>
                        <option value="7d">Last 7d</option>
                        <option value="30d">Last 30d</option>
                        <option value="90d">Last 90d</option>
                        <option value="all">All time</option>
                    </select>

                    <input type="hidden" name="limit" value={String(limit)} />

                    <div className="flex items-center gap-2 lg:col-span-6">
                        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800">
                            <Filter size={14} />
                            Apply filters
                        </button>
                        <Link href="/admin/activity" className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Reset
                        </Link>
                        <div className="ml-auto flex items-center gap-2">
                            <Link href={`/admin/activity?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === 'string')), limit: '200' }).toString()}`} className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                Load 200
                            </Link>
                            <Link href={`/admin/activity?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === 'string')), limit: '500' }).toString()}`} className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                Load 500
                            </Link>
                        </div>
                    </div>
                </form>
            </section>

            {failedRate >= 15 && (
                <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <p>
                        Failure rate is <span className="font-bold">{failedRate.toFixed(1)}%</span> in the current filtered window. Investigate recent failed events and common error messages.
                    </p>
                </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h2 className="text-sm font-bold text-slate-900">Generation events ({total})</h2>
                    <p className="text-xs text-slate-500">Window: {windowFilter}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1240px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Job target</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Score</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {normalizedRows.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900">{row.userInfo?.full_name || 'Unknown user'}</p>
                                        <p className="text-xs text-slate-500">{row.userInfo?.email || row.user_id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="max-w-[280px] truncate font-medium text-slate-800">{row.jobTarget}</p>
                                        {row.host && <p className="text-xs text-slate-500">{row.host}</p>}
                                    </td>
                                    <td className="px-6 py-4 capitalize text-slate-600">{row.job_source || 'unknown'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${row.status === 'success'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : row.status === 'failed'
                                                ? 'border-red-200 bg-red-50 text-red-700'
                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {row.score.after !== null ? (
                                            <div className="text-xs">
                                                <p className="font-semibold text-slate-800">
                                                    {row.score.after}%{' '}
                                                    {row.score.delta !== null && row.score.delta !== 0 && (
                                                        <span className={row.score.delta > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                            ({row.score.delta > 0 ? `+${row.score.delta}` : row.score.delta})
                                                        </span>
                                                    )}
                                                </p>
                                                {row.score.before !== null && <p className="text-slate-500">Before: {row.score.before}%</p>}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-600">{toDateString(row.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <p className="max-w-[280px] truncate text-xs text-slate-500">{row.error_message || row.job_url || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/resume/${row.id}`} className="text-xs font-bold text-blue-700 hover:text-blue-800">
                                            Open record
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {normalizedRows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                                        No events match this filter set.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

function MetricCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {value}
                {suffix || ''}
            </p>
        </article>
    )
}
