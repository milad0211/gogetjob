import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Plus, Clock, CheckCircle, Zap, Star, Crown, Calendar } from 'lucide-react'
import {
    hasProAccess,
    getPlanLimit,
    getCurrentUsage,
    getRemainingGenerations,
    getPlanLabel,
    getCoverLetterPlanLimit,
    getCoverLetterCurrentUsage,
} from '@/lib/subscription'

type ScoreSummary = {
    before: number | null
    after: number | null
    improvement: number | null
}

function normalizeScore(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return Math.max(0, Math.min(100, Math.round(value)))
}

function extractScoreSummary(analysis: unknown): ScoreSummary {
    if (!analysis || typeof analysis !== 'object') {
        return { before: null, after: null, improvement: null }
    }

    const raw = analysis as Record<string, unknown>
    const legacy = normalizeScore(raw.match_score)

    const beforeScoreObj = raw.beforeScore && typeof raw.beforeScore === 'object'
        ? raw.beforeScore as Record<string, unknown>
        : null
    const afterScoreObj = raw.afterScore && typeof raw.afterScore === 'object'
        ? raw.afterScore as Record<string, unknown>
        : null

    const before = normalizeScore(beforeScoreObj?.total) ?? legacy
    const after = normalizeScore(afterScoreObj?.total) ?? legacy

    return {
        before,
        after,
        improvement: before !== null && after !== null ? after - before : null,
    }
}

function formatJobHost(rawUrl?: string | null): string {
    if (!rawUrl) return 'Job Description'
    try {
        return new URL(rawUrl).hostname.replace(/^www\./, '')
    } catch {
        return 'Job Description'
    }
}

function MatchScoreCell({ analysis }: { analysis: unknown }) {
    const score = extractScoreSummary(analysis)
    const finalScore = score.after ?? score.before

    if (finalScore === null) return <span className="text-slate-400 text-sm">-</span>

    const tone = finalScore >= 70 ? 'emerald' : finalScore >= 50 ? 'amber' : 'red'
    const toneClass = tone === 'emerald'
        ? 'text-emerald-700'
        : tone === 'amber'
            ? 'text-amber-700'
            : 'text-red-700'
    const barClass = tone === 'emerald'
        ? 'bg-emerald-500'
        : tone === 'amber'
            ? 'bg-amber-500'
            : 'bg-red-500'

    if (score.before !== null && score.after !== null) {
        return (
            <div className="min-w-[160px]">
                <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                    <span className="text-slate-400">{score.before}%</span>
                    {score.improvement !== null && score.improvement !== 0 ? (
                        <span className={score.improvement > 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {score.improvement > 0 ? `+${score.improvement}` : score.improvement}
                        </span>
                    ) : (
                        <span className="text-slate-300">No change</span>
                    )}
                    <span className={toneClass}>{score.after}%</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-slate-300/80"
                        style={{ width: `${score.before}%` }}
                    />
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full ${barClass}`}
                        style={{ width: `${score.after}%` }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${barClass}`}
                    style={{ width: `${finalScore}%` }}
                />
            </div>
            <span className={`text-xs font-bold ${toneClass}`}>{finalScore}%</span>
        </div>
    )
}

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    const { data: profile } = await (await supabase)
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const { data: generations } = await (await supabase)
        .from('resume_generations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    const isPro = hasProAccess(profile)
    const planLimit = getPlanLimit(profile)
    const currentUsage = getCurrentUsage(profile)
    const remaining = getRemainingGenerations(profile)
    const coverLetterLimit = getCoverLetterPlanLimit(profile)
    const coverLetterUsed = getCoverLetterCurrentUsage(profile)
    const planLabel = getPlanLabel(profile)
    const usagePercent = planLimit > 0 ? Math.min(100, (currentUsage / planLimit) * 100) : 0
    const isLow = remaining <= 3 && remaining > 0
    const isExhausted = remaining === 0

    const cycleEndsAt = isPro && profile?.pro_cycle_ends_at
        ? new Date(profile.pro_cycle_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Welcome back, {profile?.full_name || 'Creator'}</p>
                </div>
                <Link
                    href="/dashboard/generate"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Plus size={20} /> New Resume
                </Link>
            </header>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Usage Card */}
                <div className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <FileText size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl ${isExhausted ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Zap size={20} />
                        </div>
                        <h3 className="font-bold text-slate-700">Generations Left</h3>
                    </div>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-extrabold text-slate-900">{remaining}</span>
                        <span className="text-slate-400 mb-1 font-medium">/ {planLimit}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${isExhausted ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${usagePercent}%` }}
                        ></div>
                    </div>
                    {cycleEndsAt && (
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                            <Calendar size={12} />
                            <span>Resets on {cycleEndsAt}</span>
                        </div>
                    )}
                    {!isPro && remaining <= 1 && (
                        <Link href="/dashboard/billing" className="text-xs font-bold text-blue-600 mt-3 inline-block hover:underline">
                            Upgrade for more &rarr;
                        </Link>
                    )}
                    {isPro && isExhausted && profile?.billing_cycle === 'month' && (
                        <Link href="/dashboard/billing" className="text-xs font-bold text-indigo-600 mt-3 inline-block hover:underline">
                            Upgrade to Yearly for 360/year &rarr;
                        </Link>
                    )}
                </div>

                {/* Total Card */}
                <div className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <CheckCircle size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                            <FileText size={20} />
                        </div>
                        <h3 className="font-bold text-slate-700">Resumes Created</h3>
                    </div>
                    <div className="flex items-end gap-2 text-slate-900">
                        <span className="text-4xl font-extrabold">{generations?.length || 0}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Total optimized resumes</p>
                </div>

                {/* Pro Card */}
                <div className={`relative overflow-hidden p-6 rounded-3xl shadow-sm border transition ${isPro ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700' : 'bg-white border-slate-100 text-slate-900'}`}>
                    {isPro && (
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Star size={80} />
                        </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl ${isPro ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 shadow-lg shadow-orange-500/20' : 'bg-slate-50 text-slate-400'}`}>
                            {isPro ? <Crown size={20} /> : <Star size={20} />}
                        </div>
                        <h3 className={`font-bold ${isPro ? 'text-white' : 'text-slate-700'}`}>Current Plan</h3>
                    </div>
                    <div className="mb-4">
                        <span className="text-2xl font-bold">{planLabel}</span>
                        {isPro && <div className="text-xs font-bold text-green-400 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Active</div>}
                    </div>
                    <p className={`text-sm mb-6 ${isPro ? 'text-slate-300' : 'text-slate-500'}`}>
                        {isPro
                            ? `${planLimit} generations per ${profile?.billing_cycle === 'year' ? 'year' : 'month'}. ${currentUsage} used so far.`
                            : 'Upgrade to remove limits and unlock AI Cover Letters.'}
                    </p>
                    {!isPro ? (
                        <Link href="/dashboard/billing" className="block text-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            Upgrade to Pro
                        </Link>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                <CheckCircle size={14} className="text-green-400" /> {planLimit} Resumes / {profile?.billing_cycle === 'year' ? 'Year' : 'Month'}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                <CheckCircle size={14} className="text-green-400" /> {coverLetterUsed} / {coverLetterLimit} Cover Letters
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History Table */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Clock size={20} className="text-slate-400" /> Recent History
                    </h2>
                </div>

                {generations?.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No resumes yet</h3>
                        <p className="text-slate-500 mb-6">Create your first tailored resume to see it here.</p>
                        <Link href="/dashboard/generate" className="text-blue-600 font-bold hover:underline">
                            Start Generating &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-8 py-4">Job Target</th>
                                    <th className="px-8 py-4">Date</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Match Score</th>
                                    <th className="px-8 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {generations?.map((gen) => (
                                    <tr key={gen.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    PDF
                                                </div>
                                                <p className="font-medium text-slate-900 truncate max-w-[200px]">
                                                    {formatJobHost(gen.job_url)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 text-sm">
                                            {new Date(gen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border
                         ${gen.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    gen.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                {gen.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <MatchScoreCell analysis={gen.analysis_json} />
                                        </td>
                                        <td className="px-8 py-5">
                                            <Link href={`/dashboard/resume/${gen.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}
