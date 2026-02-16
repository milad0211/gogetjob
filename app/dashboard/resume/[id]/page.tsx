import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Download, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { CoverLetterGenerator } from './_components/CoverLetterGenerator'

export default async function ResumePage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    const { data: generation } = await (await supabase)
        .from('resume_generations')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single()

    if (!generation) return notFound()

    // Fetch Profile for Pro check
    const { data: profile } = await (await supabase)
        .from('profiles')
        .select('plan, subscription_status')
        .eq('id', user?.id)
        .single()

    const isPro = profile?.plan === 'pro' && profile?.subscription_status === 'active'

    const analysis = generation.analysis_json
    const score = analysis?.match_score || 0

    return (
        <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-medium">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
                <div className="flex gap-4">
                    <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition">
                        Edit Manually (Coming Soon)
                    </button>
                    <a
                        href={`/api/download/${generation.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
                    >
                        <Download size={18} /> Download PDF
                    </a>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 flex-1 overflow-hidden min-h-0">
                {/* Left Column: Analysis & Cover Letter */}
                <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2">
                    {/* Analysis Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="text-center mb-8">
                            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="56" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                                    <circle
                                        cx="64" cy="64" r="56"
                                        stroke={score > 70 ? '#10b981' : '#f59e0b'}
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={351}
                                        strokeDashoffset={351 - (351 * score) / 100}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-slate-900">{score}</span>
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Score</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold mt-4">ATS Match Score</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-500" /> Matched Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis?.matched_keywords?.map((k: string) => (
                                        <span key={k} className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium border border-green-100">
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-amber-500" /> Missing Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis?.missing_keywords?.map((k: string) => (
                                        <span key={k} className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs font-medium border border-red-100">
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cover Letter Generator Card */}
                    <div className="flex-1 min-h-[400px]">
                        <CoverLetterGenerator resumeId={generation.id} isPro={!!isPro} />
                    </div>
                </div>

                {/* Right Column: PDF Preview */}
                <div className="lg:col-span-2 bg-slate-500 rounded-2xl shadow-inner overflow-hidden relative flex items-center justify-center">
                    <iframe
                        src={`/api/util/preview-pdf?id=${generation.id}`}
                        className="w-full h-full bg-white shadow-2xl"
                        title="Resume Preview"
                    />
                </div>
            </div>
        </div>
    )
}
