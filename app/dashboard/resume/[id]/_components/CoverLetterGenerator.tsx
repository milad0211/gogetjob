'use client'

import { useState } from 'react'
import { FileText, Lock, Loader2, Sparkles, Copy, Check, RefreshCw, Gauge } from 'lucide-react'
import Link from 'next/link'

type CoverLetterUsage = {
    used: number
    limit: number
    remaining: number
    resetsAt: string | null
}

type CoverLetterGeneratorProps = {
    resumeId: string
    isPro: boolean
    initialCoverLetter: string
    initialUsage: CoverLetterUsage | null
}

type GenerateResponse = {
    coverLetter?: string
    error?: string
    code?: string
    remaining?: number
    limit?: number
    resets_at?: string | null
}

export function CoverLetterGenerator({
    resumeId,
    isPro,
    initialCoverLetter,
    initialUsage,
}: CoverLetterGeneratorProps) {
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState(initialCoverLetter || '')
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [usage, setUsage] = useState<CoverLetterUsage | null>(initialUsage)
    const usagePercent = usage && usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0
    const usageBarTone = usage && usage.remaining <= 2 ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-blue-500'

    const applyUsageFromResponse = (data: GenerateResponse) => {
        if (typeof data.limit !== 'number' || typeof data.remaining !== 'number') return
        const limit = data.limit
        const remaining = data.remaining
        setUsage((prev) => ({
            used: Math.max(0, limit - remaining),
            limit,
            remaining,
            resetsAt: data.resets_at ?? prev?.resetsAt ?? null,
        }))
    }

    const handleGenerate = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeId }),
            })

            const data = await res.json() as GenerateResponse

            if (!res.ok) {
                applyUsageFromResponse(data)
                throw new Error(data.error || 'Failed to generate')
            }

            if (data.coverLetter) {
                setCoverLetter(data.coverLetter)
            }
            applyUsageFromResponse(data)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate cover letter'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!coverLetter) return
        navigator.clipboard.writeText(coverLetter)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isLimitReached = usage !== null && usage.remaining <= 0

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-4 mb-5">
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-indigo-200/40 blur-2xl" />
                <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-indigo-100 shadow-sm flex items-center justify-center">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight">Cover Letter</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {coverLetter
                                    ? 'Saved draft for this resume. You can copy or regenerate anytime.'
                                    : 'Create a tailored draft that matches this resume and role.'}
                            </p>
                        </div>
                    </div>

                    {isPro ? (
                        <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 whitespace-nowrap">
                            PRO
                        </span>
                    ) : (
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200 whitespace-nowrap">
                            LOCKED
                        </span>
                    )}
                </div>

                {isPro && usage && (
                    <div className="relative mt-4 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                                <Gauge size={13} className="text-slate-500" />
                                Quota usage
                            </span>
                            <span className="font-bold text-slate-900">{usage.used}/{usage.limit}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${usageBarTone}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                            <span><span className="font-semibold text-slate-700">{usage.remaining}</span> remaining</span>
                            {usage.resetsAt && (
                                <span>resets {new Date(usage.resetsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col">
                {!isPro ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-500">
                            <Lock size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Unlock Cover Letters</h4>
                        <p className="text-sm text-slate-500 mb-6">Upgrade to Pro to generate tailored cover letters for every job.</p>
                        <Link href="/dashboard/billing" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-600/20">
                            Upgrade Now
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {!coverLetter ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                {loading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
                                        <p className="text-sm text-slate-500 animate-pulse">Drafting your cover letter...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
                                            <Sparkles size={24} />
                                        </div>
                                        <p className="text-sm text-slate-500 mb-6">Generate a professional cover letter matching this resume and job description.</p>
                                        {isLimitReached && (
                                            <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                                                Cover letter quota reached for this billing cycle.
                                            </p>
                                        )}
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isLimitReached}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                        >
                                            <Sparkles size={16} /> Generate with AI
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-[320px]">
                                <div className="flex justify-end items-center gap-2 mb-3">
                                    <button
                                        onClick={copyToClipboard}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-3 py-1.5 transition"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Text'}
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || isLimitReached}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg transition"
                                    >
                                        {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                        Regenerate
                                    </button>
                                </div>
                                <textarea
                                    className="flex-1 min-h-[220px] md:min-h-[260px] w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    value={coverLetter}
                                    readOnly
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
