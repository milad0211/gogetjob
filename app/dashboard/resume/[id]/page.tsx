import { createClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/subscription'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react'
import { CoverLetterGenerator } from './_components/CoverLetterGenerator'
import type { FullAnalysis } from '@/lib/resume-engine/types'

export default async function ResumePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return notFound()

    const { data: generation } = await supabase
        .from('resume_generations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!generation) return notFound()

    const { data: profile } = await supabase
        .from('profiles')
        .select('plan, subscription_status')
        .eq('id', user.id)
        .single()

    const isPro = hasProAccess(profile)

    const analysis = generation.analysis_json as FullAnalysis | null

    // Support both legacy (match_score field) and new (beforeScore/afterScore) formats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacyScore = (analysis as any)?.match_score as number | undefined
    const beforeScore = analysis?.beforeScore?.total ?? legacyScore ?? 0
    const afterScore = analysis?.afterScore?.total ?? legacyScore ?? beforeScore
    const improvement = afterScore - beforeScore
    const gapReport = analysis?.gapReport
    const metadata = analysis?.metadata
    const beforeBreakdown = analysis?.beforeScore
    const afterBreakdown = analysis?.afterScore
    const qualityStatus = metadata?.quality_gate_status || 'passed'
    const qualityFailed = qualityStatus === 'failed'
    const stillMissing = afterBreakdown?.details?.missingPhrases || []

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-medium"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>

                <div className="flex gap-3 items-center">
                    {metadata && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-mono">
                            Engine v{metadata.engine_version}
                        </span>
                    )}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${qualityStatus === 'passed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : qualityStatus === 'warning'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        Quality: {qualityStatus}
                    </span>

                    {qualityFailed ? (
                        <>
                            <span className="bg-slate-200 text-slate-500 px-4 py-2 rounded-lg font-semibold text-sm cursor-not-allowed">
                                📄 ATS PDF Locked
                            </span>
                            <span className="bg-slate-200 text-slate-500 px-4 py-2 rounded-lg font-semibold text-sm cursor-not-allowed">
                                ✨ Premium PDF Locked
                            </span>
                        </>
                    ) : (
                        <>
                            <a
                                href={`/api/pdf/${generation.id}?mode=ats&download=1`}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                            >
                                📄 Download ATS PDF
                            </a>
                            <a
                                href={`/api/pdf/${generation.id}?mode=premium&download=1`}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                            >
                                ✨ Download Premium PDF
                            </a>
                        </>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0">
                {/* Left Column: Analysis */}
                <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-1">

                    {/* Before / After Score Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                            ATS Match Score
                        </h3>

                        <div className="flex items-center justify-around mb-4">
                            {/* Before Score */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="7" fill="none" />
                                        <circle
                                            cx="40" cy="40" r="34"
                                            stroke="#94a3b8"
                                            strokeWidth="7" fill="none"
                                            strokeDasharray={213.6}
                                            strokeDashoffset={213.6 - (213.6 * beforeScore) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-bold text-slate-500">{beforeScore}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 mt-1 font-medium">Before</span>
                            </div>

                            {/* Arrow + Improvement */}
                            <div className="flex flex-col items-center">
                                <TrendingUp size={20} className="text-emerald-500" />
                                {improvement > 0 && (
                                    <span className="text-sm font-bold text-emerald-600 mt-1">+{improvement}</span>
                                )}
                            </div>

                            {/* After Score */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="7" fill="none" />
                                        <circle
                                            cx="40" cy="40" r="34"
                                            stroke={afterScore >= 70 ? '#10b981' : afterScore >= 50 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="7" fill="none"
                                            strokeDasharray={213.6}
                                            strokeDashoffset={213.6 - (213.6 * afterScore) / 100}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-bold text-slate-900">{afterScore}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 mt-1 font-bold">After</span>
                            </div>
                        </div>

                        {/* Dimensional Breakdown */}
                        {beforeBreakdown && afterBreakdown && (
                            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                                <DimensionBar label="Keywords" before={beforeBreakdown.keywordCoverage} after={afterBreakdown.keywordCoverage} weight="35%" />
                                <DimensionBar label="Structure" before={beforeBreakdown.structureHygiene} after={afterBreakdown.structureHygiene} weight="25%" />
                                <DimensionBar label="Evidence" before={beforeBreakdown.relevanceEvidence} after={afterBreakdown.relevanceEvidence} weight="25%" />
                                <DimensionBar label="Impact" before={beforeBreakdown.impactClarity} after={afterBreakdown.impactClarity} weight="15%" />
                            </div>
                        )}
                    </div>

                    {/* Keyword Analysis */}
                    {gapReport && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Keyword Analysis
                            </h3>

                            {gapReport.matchedKeywords?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                                        <CheckCircle size={14} className="text-emerald-500" /> Matched
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {gapReport.matchedKeywords.slice(0, 12).map((m, i) => (
                                            <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-medium border border-emerald-100">
                                                {m.keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {stillMissing.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                                        <AlertTriangle size={14} className="text-amber-500" /> Still Missing
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {stillMissing.slice(0, 10).map((k, i) => (
                                            <span key={i} className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-xs font-medium border border-red-100">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Consider adding experience with {stillMissing.slice(0, 3).join(', ')} to strengthen your profile.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Parser Warnings */}
                    {metadata?.parser_warnings && metadata.parser_warnings.length > 0 && (
                        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                            <h4 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                                <AlertTriangle size={14} /> Parser Notes
                            </h4>
                            <ul className="space-y-1">
                                {metadata.parser_warnings.map((w, i) => (
                                    <li key={i} className="text-xs text-amber-700">• {w}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Cover Letter */}
                    <div className="flex-1 min-h-[350px]">
                        <CoverLetterGenerator resumeId={generation.id} isPro={!!isPro} />
                    </div>
                </div>

                {/* Right Column: PDF Preview */}
                <div className="lg:col-span-2 bg-slate-600 rounded-2xl shadow-inner overflow-hidden relative flex items-center justify-center min-h-[600px]">
                    <iframe
                        src={`/api/pdf/${generation.id}?mode=ats`}
                        className="w-full h-full bg-white"
                        title="Resume Preview"
                    />
                    {qualityFailed && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="bg-white/95 text-slate-900 px-5 py-4 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
                                <ShieldAlert className="text-red-500" size={20} />
                                <div>
                                    <p className="font-semibold text-sm">Quality Check Failed</p>
                                    <p className="text-xs text-slate-500">Fix detected issues and regenerate to unlock PDF download.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Dimension Bar Component ───────────────────────────────────────────

function DimensionBar({ label, before, after, weight }: {
    label: string
    before: number
    after: number
    weight: string
}) {
    const improvement = after - before
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-600 font-medium">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{Math.round(before)}</span>
                    <span className="text-xs text-slate-300">→</span>
                    <span className={`text-xs font-bold ${after >= 70 ? 'text-emerald-600' : after >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {Math.round(after)}
                    </span>
                    {improvement > 0 && (
                        <span className="text-xs text-emerald-500 font-medium">+{Math.round(improvement)}</span>
                    )}
                </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${after}%`,
                        background: after >= 70
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : after >= 50
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                : 'linear-gradient(90deg, #ef4444, #dc2626)'
                    }}
                />
            </div>
        </div>
    )
}
