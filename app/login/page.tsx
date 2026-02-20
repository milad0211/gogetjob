'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleLogin = async () => {
        console.log('handleLogin')
        setIsLoading(true)
        setErrorMsg('')
        const supabase = createClient()

        // Attempt Google Login
        // NOTE: This requires Google Auth to be ENABLED in your Supabase Project Dashboard
        // URL: https://supabase.com/dashboard/project/_/auth/providers
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error(error)
            setErrorMsg(error.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex bg-slate-50 min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-8 left-8">
                <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
                    <ArrowLeft size={20} /> Back to Home
                </Link>
            </div>

            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
                    <h2 className="text-3xl font-extrabold text-slate-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in to access your dashboard and saved resumes
                    </p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                        Error: {errorMsg}
                    </div>
                )}

                <div className="mt-8 space-y-6">
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-slate-200 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#EA4335"
                                        d="M24 12.276c0-.887-.076-1.743-.225-2.571H12.236v4.864h6.634c-.287 1.516-1.127 2.802-2.4 3.655v3.012h3.876c2.268-2.087 3.578-5.165 3.578-8.96z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12.236 24c3.24 0 5.968-1.076 7.955-2.915l-3.876-3.012c-1.077.72-2.456 1.144-4.079 1.144-3.144 0-5.808-2.124-6.756-4.985H1.488v3.13C3.522 21.282 7.625 24 12.236 24z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.48 14.232a7.127 7.127 0 01-.366-2.232c0-.776.134-1.52.366-2.232V6.638H1.488A11.96 11.96 0 000 12c0 1.92.46 3.738 1.288 5.362l3.992-3.13z"
                                    />
                                    <path
                                        fill="#4285F4"
                                        d="M12.236 4.75c1.762 0 3.344.606 4.588 1.795l3.435-3.419C18.204 1.192 15.476 0 12.236 0 7.625 0 3.522 2.718 1.488 6.638l3.992 3.13C6.429 6.874 9.092 4.75 12.236 4.75z"
                                    />
                                </svg>
                                <span>Continue with Google</span>
                            </div>
                        )}
                    </button>

                    <p className="text-xs text-center text-slate-400">
                        By clicking continue, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}
