import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, ArrowRight, Sparkles } from 'lucide-react'

export default async function CoverLetterPage() {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    const { data: generations } = await (await supabase)
        .from('resume_generations')
        .select('*')
        .eq('user_id', user?.id)
        .not('cover_letter_text', 'is', null) // Only show ones with cover letters
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Cover Letters</h1>
                    <p className="text-slate-500 mt-1">Manage and export your AI-generated cover letters.</p>
                </div>
            </div>

            {(!generations || generations.length === 0) ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Cover Letters Yet</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Generate a professional cover letter for any of your existing resumes to see it here.
                    </p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-600/20">
                        <Sparkles size={20} />
                        Go to Dashboard to Generate
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generations.map((gen) => (
                        <div key={gen.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <FileText size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                    {new Date(gen.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">
                                {gen.job_url ? new URL(gen.job_url).hostname : 'Job Application'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-3">
                                {gen.cover_letter_text}
                            </p>
                            <Link
                                href={`/dashboard/resume/${gen.id}`}
                                className="flex items-center gap-2 text-sm font-bold text-blue-600 group-hover:gap-3 transition-all"
                            >
                                View & Edit <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
