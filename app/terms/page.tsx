import Link from 'next/link'

const LAST_UPDATED = 'February 23, 2026'

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-6">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-10 border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
                        <p className="text-xs uppercase tracking-wide font-bold text-slate-300">Legal</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">Terms of Service</h1>
                        <p className="text-sm text-slate-300 mt-4">Last updated: {LAST_UPDATED}</p>
                    </div>

                    <div className="px-8 py-10 space-y-8 text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Service Scope</h2>
                            <p>
                                ResumeAI provides AI-assisted resume optimization, scoring insights, and optional cover letter generation.
                                We continuously improve outputs but do not guarantee interviews, offers, or hiring outcomes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Account Responsibilities</h2>
                            <p>
                                You are responsible for your account credentials and all actions performed through your account.
                                You must provide accurate information and keep it updated.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Acceptable Use</h2>
                            <p>
                                You may not use the platform for unlawful, abusive, deceptive, or fraudulent activity.
                                You may not attempt to disrupt service security, reverse engineer protected systems, or violate usage limits.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Subscriptions & Billing</h2>
                            <p>
                                Paid plans renew automatically until canceled. You can cancel from your dashboard billing area.
                                When canceled, access remains active through the end of the current billing period.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Intellectual Property</h2>
                            <p>
                                You retain rights to content you upload. The platform, models, UI, and related software remain the property
                                of ResumeAI and its licensors.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Disclaimer & Liability</h2>
                            <p>
                                Service is provided &quot;as is&quot; without warranties of uninterrupted availability or specific performance outcomes.
                                To the maximum extent allowed by law, ResumeAI is not liable for indirect or consequential damages.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Updates to Terms</h2>
                            <p>
                                We may update these terms periodically. Material changes will be reflected on this page with a revised date.
                            </p>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Contact</h2>
                            <p className="text-sm">
                                Questions about these terms can be sent to{' '}
                                <a href="mailto:legal@resumeai.app" className="font-semibold text-blue-700 hover:underline">
                                    legal@resumeai.app
                                </a>
                                .
                            </p>
                            <p className="text-sm mt-2">
                                For general help, visit the <Link href="/contact" className="font-semibold text-blue-700 hover:underline">Contact page</Link>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    )
}
