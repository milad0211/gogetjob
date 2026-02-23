import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, ArrowRight, Sparkles, PenLine, Lock, Crown, CheckCircle2 } from 'lucide-react'
import { hasProAccess } from '@/lib/subscription'

function formatHost(rawUrl: string | null): string {
    if (!rawUrl) return 'Job Description'
    try {
        return new URL(rawUrl).hostname.replace(/^www\./, '')
    } catch {
        return 'Job Description'
    }
}

export default async function CoverLetterPage() {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    const { data: profile } = await (await supabase)
        .from('profiles')
        .select('plan, subscription_status, pro_access_until')
        .eq('id', user?.id)
        .single()

    const isPro = hasProAccess(profile)

    const { data: generations } = await (await supabase)
        .from('resume_generations')
        .select('id, created_at, job_url, cover_letter_text, status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    const allGenerations = generations || []
    const generatedLetters = allGenerations.filter((gen) => !!gen.cover_letter_text)
    const readyToGenerate = allGenerations.filter((gen) => !gen.cover_letter_text).slice(0, 8)

    if (!isPro) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-8">
                <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-8 md:p-10">
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-200/40 blur-2xl" />
                    <div className="flex flex-col md:flex-row md:items-center gap-6 relative">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Lock size={30} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900">Cover Letters</h1>
                            <p className="text-slate-600 mt-2 max-w-2xl">
                                This section is available on Pro only. Upgrade to generate tailored cover letters from each optimized resume.
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/dashboard/billing"
                                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition"
                                >
                                    <Crown size={18} /> Upgrade to Pro
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-6 py-3 rounded-xl font-semibold transition"
                                >
                                    Go Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Cover Letters</h1>
                    <p className="text-slate-500 mt-1">
                        Manage generated letters and start a new one from your recent resumes.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-semibold w-fit">
                    <CheckCircle2 size={16} />
                    <span>Pro Feature Active</span>
                </div>
            </div>

            {generatedLetters.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-14 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PenLine size={38} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">No Cover Letters Yet</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Your generated cover letters will appear here. Start from one of your recent resumes below.
                    </p>
                    <Link href="/dashboard/generate" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-600/20">
                        <Sparkles size={20} />
                        Create New Resume
                    </Link>
                </div>
            ) : (
                <section>
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Generated Cover Letters</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {generatedLetters.map((gen) => (
                            <div key={gen.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FileText size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">
                                        {new Date(gen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">
                                    {formatHost(gen.job_url)}
                                </h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-3">
                                    {gen.cover_letter_text}
                                </p>
                                <Link
                                    href={`/dashboard/resume/${gen.id}`}
                                    className="flex items-center gap-2 text-sm font-bold text-blue-600 group-hover:gap-3 transition-all"
                                >
                                    Open Resume & Letter <ArrowRight size={16} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Generate New Cover Letter</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Pick a recent resume and generate a fresh letter from its job context.
                </p>

                {readyToGenerate.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-slate-700 font-medium">All recent resumes already have cover letters.</p>
                        <p className="text-sm text-slate-500 mt-1 mb-5">Create a new resume to generate another one.</p>
                        <Link href="/dashboard/generate" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition">
                            <Sparkles size={16} />
                            Create New Resume
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {readyToGenerate.map((gen) => (
                            <Link
                                key={gen.id}
                                href={`/dashboard/resume/${gen.id}`}
                                className="group rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 p-5 transition"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{formatHost(gen.job_url)}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(gen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-bold">
                                        Generate <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
