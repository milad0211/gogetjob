'use client'

import { useState } from 'react'
import { FileText, Lock, Loader2, Sparkles, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export function CoverLetterGenerator({ resumeId, isPro }: { resumeId: string, isPro: boolean }) {
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState('')
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeId })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to generate')

            setCoverLetter(data.coverLetter)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(coverLetter)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" /> Cover Letter
                </h3>
                {isPro && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">PRO Feature</span>}
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
                                        <button
                                            onClick={handleGenerate}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                        >
                                            <Sparkles size={16} /> Generate with AI
                                        </button>
                                        {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-end mb-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-slate-500 hover:text-blue-600 text-xs font-bold flex items-center gap-1 transition"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Text'}
                                    </button>
                                </div>
                                <textarea
                                    className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
