import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
    Activity,
    ArrowUpRight,
    BadgeDollarSign,
    CheckCircle2,
    Crown,
    FileText,
    ShieldAlert,
    Users,
    Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveJobTargetLabel } from '@/lib/job-target'
import { ClientUserRow } from './_components/ClientUserRow'

const MONTHLY_PRICE = 50
const YEARLY_PRICE = 400

type OverviewProfile = {
    id: string
    full_name: string | null
    email: string
    plan: 'free' | 'pro'
    is_admin: boolean | null
    billing_cycle: 'month' | 'year' | null
    subscription_status: string | null
    pro_access_until: string | null
    created_at: string
    total_generations_used: number | null
    free_generations_used_total: number | null
    pro_generations_used_cycle: number | null
    pro_cover_letters_used_cycle: number | null
}

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
    if (!analysis || typeof analysis !== 'object') {
        return { before: null, after: null, delta: null }
    }
    const raw = analysis as Record<string, unknown>
    const beforeScore = raw.beforeScore && typeof raw.beforeScore === 'object'
        ? (raw.beforeScore as Record<string, unknown>)
        : null
    const afterScore = raw.afterScore && typeof raw.afterScore === 'object'
        ? (raw.afterScore as Record<string, unknown>)
        : null
    const before = normalizeScore(beforeScore?.total)
    const after = normalizeScore(afterScore?.total)
    return {
        before,
        after,
        delta: before !== null && after !== null ? after - before : null,
    }
}

function formatDate(value: string): string {
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const now = new Date()
    const nowIso = now.toISOString()
    const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgoIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const inSevenDaysIso = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
        { count: totalUsers },
        { count: totalGenerations },
        { count: activeProCount },
        { count: monthlyProCount },
        { count: yearlyProCount },
        { count: coverLetterCount },
        { count: newUsers7d },
        { count: newUsers30d },
        { count: generations24h },
        { count: generations7d },
        { count: success7d },
        { count: failed7d },
        { data: expiringPros },
        { data: recentUsers },
        { data: activityRows },
        { data: topUsers },
    ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('resume_generations').select('id', { count: 'exact', head: true }),
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('plan', 'pro')
            .gt('pro_access_until', nowIso),
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('plan', 'pro')
            .eq('billing_cycle', 'month')
            .gt('pro_access_until', nowIso),
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('plan', 'pro')
            .eq('billing_cycle', 'year')
            .gt('pro_access_until', nowIso),
        supabase
            .from('resume_generations')
            .select('id', { count: 'exact', head: true })
            .not('cover_letter_text', 'is', null),
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgoIso),
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgoIso),
        supabase
            .from('resume_generations')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', twentyFourHoursAgoIso),
        supabase
            .from('resume_generations')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgoIso),
        supabase
            .from('resume_generations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'success')
            .gte('created_at', sevenDaysAgoIso),
        supabase
            .from('resume_generations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'failed')
            .gte('created_at', sevenDaysAgoIso),
        supabase
            .from('profiles')
            .select('id, full_name, email, pro_access_until, billing_cycle')
            .eq('plan', 'pro')
            .gt('pro_access_until', nowIso)
            .lte('pro_access_until', inSevenDaysIso)
            .order('pro_access_until', { ascending: true })
            .limit(5),
        supabase
            .from('profiles')
            .select('id, full_name, email, plan, is_admin, subscription_status, billing_cycle, pro_access_until, created_at, total_generations_used, free_generations_used_total, pro_generations_used_cycle, pro_cover_letters_used_cycle')
            .order('created_at', { ascending: false })
            .limit(12),
        supabase
            .from('resume_generations')
            .select('id, user_id, job_source, job_url, job_text, status, error_message, analysis_json, created_at')
            .order('created_at', { ascending: false })
            .limit(24),
        supabase
            .from('profiles')
            .select('id, full_name, email, plan, total_generations_used')
            .order('total_generations_used', { ascending: false })
            .limit(5),
    ])

    const recentUsersTyped = (recentUsers || []) as OverviewProfile[]
    const activitiesTyped = (activityRows || []) as ActivityRow[]

    const idsFromActivity = Array.from(new Set(activitiesTyped.map((row) => row.user_id)))
    const missingIds = idsFromActivity.filter((id) => !recentUsersTyped.some((u) => u.id === id))
    const { data: missingProfiles } = missingIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, email, plan')
            .in('id', missingIds)
        : { data: [] as Array<{ id: string; full_name: string | null; email: string; plan: 'free' | 'pro' }> }

    const profileMap = new Map<string, { full_name: string | null; email: string; plan: 'free' | 'pro' }>()
    for (const profile of recentUsersTyped) {
        profileMap.set(profile.id, {
            full_name: profile.full_name,
            email: profile.email,
            plan: profile.plan,
        })
    }
    for (const profile of missingProfiles || []) {
        profileMap.set(profile.id, {
            full_name: profile.full_name,
            email: profile.email,
            plan: profile.plan,
        })
    }

    const userStats = new Map<string, { count: number; lastGenerationAt: string | null }>()
    for (const row of activitiesTyped) {
        const existing = userStats.get(row.user_id)
        if (!existing) {
            userStats.set(row.user_id, { count: 1, lastGenerationAt: row.created_at })
            continue
        }
        existing.count += 1
    }

    const recentUsersWithStats = recentUsersTyped.map((u) => {
        const stat = userStats.get(u.id)
        return {
            ...u,
            generationCount: u.total_generations_used ?? stat?.count ?? 0,
            lastGenerationAt: stat?.lastGenerationAt || null,
        }
    })

    const proMonthly = monthlyProCount ?? 0
    const proYearly = yearlyProCount ?? 0
    const estimatedMrr = (proMonthly * MONTHLY_PRICE) + (proYearly * (YEARLY_PRICE / 12))
    const conversionRate = (activeProCount ?? 0) > 0 && (totalUsers ?? 0) > 0
        ? ((activeProCount ?? 0) / (totalUsers ?? 1)) * 100
        : 0
    const successRate7d = (generations7d ?? 0) > 0
        ? ((success7d ?? 0) / (generations7d ?? 1)) * 100
        : 0

    return (
        <div className="space-y-7">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-7 text-white shadow-xl shadow-slate-300/40">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-100">
                            <ShieldAlert size={13} />
                            Admin Operations Cockpit
                        </p>
                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
                            Monitor growth, risk, and user lifecycle from one surface
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                            Designed for daily SaaS operations: identify revenue opportunities, detect quality regressions, and execute account-level actions without context switching.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/users" className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-100">
                            Manage users
                            <ArrowUpRight size={14} />
                        </Link>
                        <Link href="/admin/activity" className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            Open activity
                            <ArrowUpRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Users} label="Total users" value={(totalUsers ?? 0).toLocaleString()} hint={`+${newUsers7d ?? 0} in last 7 days`} tone="blue" />
                <MetricCard icon={Crown} label="Active Pro users" value={(activeProCount ?? 0).toLocaleString()} hint={`${conversionRate.toFixed(1)}% conversion`} tone="emerald" />
                <MetricCard icon={FileText} label="Generations (7d)" value={(generations7d ?? 0).toLocaleString()} hint={`${successRate7d.toFixed(1)}% success rate`} tone="violet" />
                <MetricCard icon={BadgeDollarSign} label="Estimated MRR" value={`$${Math.round(estimatedMrr).toLocaleString()}`} hint={`${proMonthly} monthly / ${proYearly} yearly`} tone="amber" />
                <MetricCard icon={Zap} label="Generations (24h)" value={(generations24h ?? 0).toLocaleString()} hint={`${totalGenerations ?? 0} lifetime runs`} tone="cyan" />
                <MetricCard icon={CheckCircle2} label="Cover letters" value={(coverLetterCount ?? 0).toLocaleString()} hint="Total generated letters" tone="green" />
                <MetricCard icon={Users} label="New users (30d)" value={(newUsers30d ?? 0).toLocaleString()} hint={`${newUsers7d ?? 0} joined in last 7 days`} tone="slate" />
                <MetricCard icon={Activity} label="Failed runs (7d)" value={(failed7d ?? 0).toLocaleString()} hint={failed7d && failed7d > 0 ? 'Needs monitoring' : 'No failures in range'} tone={failed7d && failed7d > 0 ? 'rose' : 'emerald'} />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Operational risk queue</h2>
                        <Link href="/admin/activity?status=failed&window=7d" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                            Review failures
                        </Link>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Pro renewals at risk (7d)</p>
                            <p className="mt-1 text-2xl font-extrabold text-amber-900">{expiringPros?.length ?? 0}</p>
                            <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
                                {(expiringPros || []).slice(0, 3).map((row) => (
                                    <li key={row.id} className="truncate">
                                        {(row.full_name || row.email)} - {new Date(row.pro_access_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </li>
                                ))}
                                {(expiringPros || []).length === 0 && <li>No expiring Pro accounts in next 7 days.</li>}
                            </ul>
                        </div>

                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Failures (7d)</p>
                            <p className="mt-1 text-2xl font-extrabold text-rose-900">{failed7d ?? 0}</p>
                            <ul className="mt-2 space-y-1 text-xs text-rose-900/90">
                                {activitiesTyped.filter((row) => row.status === 'failed').slice(0, 3).map((row) => (
                                    <li key={row.id} className="truncate">
                                        {(profileMap.get(row.user_id)?.email || row.user_id.slice(0, 8))} - {(row.error_message || 'Unknown error').slice(0, 80)}
                                    </li>
                                ))}
                                {activitiesTyped.filter((row) => row.status === 'failed').length === 0 && <li>No failed runs in loaded events.</li>}
                            </ul>
                        </div>
                    </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Top active users</h2>
                    <p className="mt-1 text-xs text-slate-500">Ranked by lifetime generated resumes.</p>
                    <div className="mt-3 space-y-2">
                        {(topUsers || []).map((u, idx) => (
                            <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">{u.full_name || u.email}</p>
                                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-extrabold text-slate-900">#{idx + 1}</p>
                                    <p className="text-xs text-slate-500">{u.total_generations_used ?? 0} runs</p>
                                </div>
                            </div>
                        ))}
                        {(topUsers || []).length === 0 && (
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">No user activity yet.</p>
                        )}
                    </div>
                </article>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h2 className="text-base font-bold text-slate-900">Recent users</h2>
                    <Link href="/admin/users" className="text-xs font-semibold text-blue-700 hover:text-blue-800">Open full user management</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Resumes</th>
                                <th className="px-6 py-3">Last generation</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsersWithStats.map((u) => (
                                <ClientUserRow key={u.id} user={u} showMonitoring currentAdminId={user.id} />
                            ))}
                            {recentUsersWithStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h2 className="text-base font-bold text-slate-900">Latest generation events</h2>
                    <Link href="/admin/activity" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                        Open monitoring view
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Job target</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Score</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activitiesTyped.slice(0, 12).map((row) => {
                                const profile = profileMap.get(row.user_id)
                                const scores = extractScoreSummary(row.analysis_json)
                                const jobTarget = resolveJobTargetLabel({
                                    jobText: row.job_text,
                                    jobUrl: row.job_url,
                                    analysis: row.analysis_json,
                                    fallbackLabel: 'Role context',
                                })

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-900">{profile?.full_name || 'Unknown user'}</p>
                                            <p className="text-xs text-slate-500">{profile?.email || row.user_id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="max-w-[280px] truncate font-medium text-slate-800">{jobTarget}</p>
                                            <p className="text-xs text-slate-500">{row.job_url || 'Pasted job text'}</p>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-slate-600">{row.job_source || 'unknown'}</td>
                                        <td className="px-6 py-4">
                                            {scores.after !== null ? (
                                                <div className="text-xs">
                                                    <p className="font-semibold text-slate-800">
                                                        {scores.after}% {scores.delta !== null && scores.delta !== 0 ? (
                                                            <span className={scores.delta > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                                ({scores.delta > 0 ? `+${scores.delta}` : scores.delta})
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    {scores.before !== null && <p className="text-slate-500">Before: {scores.before}%</p>}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
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
                                        <td className="px-6 py-4 text-xs text-slate-600">{formatDate(row.created_at)}</td>
                                    </tr>
                                )
                            })}
                            {activitiesTyped.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">No activity found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    hint,
    tone,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>
    label: string
    value: string
    hint: string
    tone: 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'green' | 'slate' | 'rose'
}) {
    const toneStyles: Record<typeof tone, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        violet: 'bg-violet-50 text-violet-700 border-violet-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
        rose: 'bg-rose-50 text-rose-700 border-rose-200',
    }

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className={`inline-flex rounded-xl border p-2 ${toneStyles[tone]}`}>
                <Icon size={18} />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </article>
    )
}
