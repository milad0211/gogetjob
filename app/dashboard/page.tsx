import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Plus, Clock, CheckCircle, Zap, Star } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    const { data: profile } = await (await supabase)
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Mock data for graph to make it look "Pro"
    const activityData = [4, 2, 5, 1, 3, 6, 4]

    const { data: generations } = await (await supabase)
        .from('resume_generations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    const freeUsage = profile?.free_generations_used || 0
    const isPro = profile?.plan === 'pro'
    const usageLimit = isPro ? 'Unlimited' : 3
    const remaining = isPro ? 999 : 3 - freeUsage

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
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-bold text-slate-700">Generations Left</h3>
                    </div>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-extrabold text-slate-900">{isPro ? '∞' : remaining}</span>
                        <span className="text-slate-400 mb-1 font-medium">/ {usageLimit}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${remaining === 0 && !isPro ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: isPro ? '100%' : `${(freeUsage / 3) * 100}%` }}
                        ></div>
                    </div>
                    {!isPro && remaining <= 1 && (
                        <Link href="/dashboard/billing" className="text-xs font-bold text-blue-600 mt-3 inline-block hover:underline">
                            Upgrade for unlimited &rarr;
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
                            {isPro ? <Star size={20} fill="currentColor" /> : <Star size={20} />}
                        </div>
                        <h3 className={`font-bold ${isPro ? 'text-white' : 'text-slate-700'}`}>Current Plan</h3>
                    </div>
                    <div className="mb-4">
                        <span className="text-2xl font-bold">{isPro ? 'Pro Member' : 'Free Starter'}</span>
                        {isPro && <div className="text-xs font-bold text-green-400 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Active</div>}
                    </div>
                    <p className={`text-sm mb-6 ${isPro ? 'text-slate-300' : 'text-slate-500'}`}>
                        {isPro ? 'You have access to all premium features, including Cover Letters and Advanced Analysis.' : 'Upgrade to remove limits and unlock AI Cover Letters.'}
                    </p>
                    {!isPro ? (
                        <Link href="/dashboard/billing" className="block text-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            Upgrade to Pro
                        </Link>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                <CheckCircle size={14} className="text-green-400" /> Unlimited Resumes
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                <CheckCircle size={14} className="text-green-400" /> Cover Letter Generator
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
                        <Link href="/generate" className="text-blue-600 font-bold hover:underline">
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
                                                    {gen.job_url ? new URL(gen.job_url).hostname : 'Job Description'}
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
                                            {gen.analysis_json?.match_score ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${gen.analysis_json.match_score > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${gen.analysis_json.match_score}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold">{gen.analysis_json.match_score}%</span>
                                                </div>
                                            ) : '-'}
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
