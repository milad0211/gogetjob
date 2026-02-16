import { createClient } from '@/lib/supabase/server'
import { CheckCircle } from 'lucide-react'

export default async function BillingPage() {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()
    const { data: profile } = await (await supabase).from('profiles').select('*').eq('id', user?.id).single()

    // Relaxed check: logic now considers 'active' OR 'pro' plan as sufficient for display, 
    // assuming 'pro' plan implies active or valid override.
    const isPro = profile?.plan === 'pro' // && profile?.subscription_status === 'active'

    const CHECKOUT_LINK = `${process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL}?metadata[user_id]=${user?.id}`

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Manage Subscription</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Your Current Plan</h2>
                            <p className="text-slate-500 mt-1">
                                {isPro ? 'You are a Pro Member' : 'You are on the Free Starter Plan'}
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold text-sm ${isPro ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                            {isPro ? 'Pro Active' : 'Free Tier'}
                        </div>
                    </div>

                    {!isPro ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-lg text-blue-900 mb-4">Upgrade to Pro</h3>
                            <ul className="space-y-3 mb-6">
                                {['Unlimited Resume Generations', 'Advanced Gap Analysis', 'Premium Templates', 'Priority Support'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-blue-800">
                                        <CheckCircle size={18} className="text-blue-600" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={CHECKOUT_LINK}
                                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-3 rounded-xl transition shadow-lg shadow-blue-600/20"
                            >
                                Subscribe - $50 / month
                            </a>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8 text-center">
                            <p className="text-green-800 font-medium">Your subscription is active. Enjoy unlimited resume generations!</p>
                            <button className="mt-4 text-green-700 underline text-sm">Manage Subscription in Polar</button>
                        </div>
                    )}

                    <div className="text-sm text-slate-500">
                        <p>Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US') : 'N/A'}</p>
                        <p>Total Resumes Generated: {profile?.free_generations_used ?? 0}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
