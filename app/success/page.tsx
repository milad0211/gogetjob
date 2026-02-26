import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ checkout_id?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const params = await searchParams
    const checkoutId = params.checkout_id

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Auto-redirect to dashboard after 5 seconds */}
            <meta httpEquiv="refresh" content="5;url=/dashboard" />

            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
                <p className="text-slate-500 mb-8">
                    Thank you for upgrading to Pro. Your account has been activated and all limits have been removed.
                </p>

                {checkoutId && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-sm text-slate-500 break-all">
                        Checkout ID: <span className="font-mono text-slate-700">{checkoutId}</span>
                    </div>
                )}

                <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition shadow-lg hover:-translate-y-1"
                >
                    Go to Dashboard <ArrowRight size={20} />
                </Link>
            </div>
            <p className="mt-8 text-slate-400 text-sm">
                You will be redirected to dashboard in 5 seconds...
            </p>
        </div>
    )
}
