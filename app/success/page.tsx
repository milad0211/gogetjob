import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuccessPage({
    searchParams,
}: {
    searchParams: { checkout_id?: string }
}) {
    // Optional: Verify checkout_id with Polar API if needed, 
    // but for now we just show success and let the webhook handle the DB update.
    // We can check if the user is upgraded in DB (polling) or just show a success message.

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
                <p className="text-slate-500 mb-8">
                    Thank you for upgrading to Pro. Your account has been activated and all limits have been removed.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-sm text-slate-500 break-all">
                    Checkout ID: <span className="font-mono text-slate-700">{searchParams.checkout_id}</span>
                </div>

                <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition shadow-lg hover:-translate-y-1"
                >
                    Go to Dashboard <ArrowRight size={20} />
                </Link>
            </div>
            <p className="mt-8 text-slate-400 text-sm">
                If your features aren't active yet, please wait a moment and refresh.
            </p>
        </div>
    )
}
