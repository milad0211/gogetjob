import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Zap, Crown, Calendar, ArrowRight } from 'lucide-react'
import { hasProAccess, getPlanLimit, getCurrentUsage, getRemainingGenerations, getPlanLabel } from '@/lib/subscription'

export default async function BillingPage() {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()
    const { data: profile } = await (await supabase).from('profiles').select('*').eq('id', user?.id).single()

    const isPro = hasProAccess(profile)
    const planLabel = getPlanLabel(profile)
    const planLimit = getPlanLimit(profile)
    const currentUsage = getCurrentUsage(profile)
    const remaining = getRemainingGenerations(profile)
    const usagePercent = Math.min(100, (currentUsage / planLimit) * 100)
    const isExhausted = remaining === 0

    const cycleEndsAt = isPro && profile?.pro_cycle_ends_at
        ? new Date(profile.pro_cycle_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null

    const isCanceled = profile?.subscription_status === 'canceled'

    const MONTHLY_CHECKOUT = `${process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_MONTHLY}?metadata[user_id]=${user?.id}`
    const YEARLY_CHECKOUT = `${process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_YEARLY}?metadata[user_id]=${user?.id}`

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Manage Subscription</h1>
            <p className="text-slate-500 mb-8">View your plan details, usage, and billing.</p>

            {/* Current Plan Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Your Current Plan</h2>
                            <p className="text-slate-500 mt-1">{planLabel}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold text-sm ${isPro
                            ? isCanceled ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                            }`}>
                            {isPro ? (isCanceled ? 'Cancels Soon' : 'Pro Active') : 'Free Tier'}
                        </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="bg-slate-50 rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-slate-700">Usage This {isPro && profile?.billing_cycle === 'year' ? 'Year' : isPro ? 'Month' : 'Lifetime'}</span>
                            <span className={`text-sm font-bold ${isExhausted ? 'text-red-600' : 'text-slate-900'}`}>{currentUsage} / {planLimit}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isExhausted ? 'bg-red-500' : remaining <= 3 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${usagePercent}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-slate-500">{remaining} remaining</span>
                            {cycleEndsAt && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar size={12} /> Resets on {cycleEndsAt}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Canceled notice */}
                    {isPro && isCanceled && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-amber-800 font-medium">
                                Your subscription has been canceled. You still have Pro access until <strong>{cycleEndsAt || 'end of period'}</strong>. After that, you will switch to the Free plan.
                            </p>
                        </div>
                    )}



                    {isPro && !isCanceled && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
                            <p className="text-green-800 font-medium mb-2">Your subscription is active. Enjoy {planLimit} resume generations per {profile?.billing_cycle === 'year' ? 'year' : 'month'}!</p>
                            {profile?.billing_cycle === 'month' && (
                                // <a href={YEARLY_CHECKOUT} className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline mt-2">
                                <a href="/api/polar/portal" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline mt-2">
                                    <Crown size={14} /> Switch to Yearly and save 33% <ArrowRight size={14} />
                                </a>
                            )}
                        </div>
                    )}

                    <div className="text-sm text-slate-500 mt-6 space-y-1">
                        <p>Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US') : 'N/A'}</p>
                        <p>Total Resumes Generated (Free): {profile?.free_generations_used_total ?? 0}</p>
                        {isPro && <p>Pro Resumes This Cycle: {profile?.pro_generations_used_cycle ?? 0}</p>}
                    </div>
                </div>
            </div>

            {/* Upgrade Section — show for free users or canceled users */}
            {(!isPro || isCanceled) && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Choose Your Pro Plan</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Pro Monthly */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-blue-300 transition flex flex-col relative group">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <Zap size={20} className="text-blue-600" /> Pro Monthly
                                </h3>
                                <p className="text-slate-500 text-sm">For active job seekers.</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-extrabold text-slate-900">$50</span>
                                <span className="text-slate-500">/ month</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {[
                                    '30 Resume Generations / Month',
                                    'Advanced Gap Analysis & Scoring',
                                    'Cover Letter Generator',
                                    'Priority Support',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                                        <CheckCircle size={16} className="text-blue-600 flex-shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={MONTHLY_CHECKOUT}
                                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-600/20 hover:-translate-y-0.5"
                            >
                                Subscribe Monthly
                            </a>
                        </div>

                        {/* Pro Yearly */}
                        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border-2 border-slate-700 text-white flex flex-col relative">
                            <div className="absolute -top-4 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full border-4 border-white shadow-lg">
                                BEST VALUE — SAVE 33%
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                                    <Crown size={20} className="text-yellow-400" /> Pro Yearly
                                </h3>
                                <p className="text-slate-400 text-sm">For power users & career changers.</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-extrabold">$400</span>
                                <span className="text-slate-400">/ year</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-6">That&apos;s ~$33/mo — Best deal!</p>
                            <ul className="space-y-3 mb-8 flex-1">
                                {[
                                    '360 Resume Generations / Year',
                                    'All Pro Monthly Features',
                                    'Exclusive Templates',
                                    'Priority Support',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                                        <CheckCircle size={16} className="text-indigo-400 flex-shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={YEARLY_CHECKOUT}
                                className="block w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-center font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
                            >
                                Subscribe Yearly — Save 33%
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
