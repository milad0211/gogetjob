import Link from 'next/link'

const LAST_UPDATED = 'February 23, 2026'

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-6">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-10 border-b border-slate-100 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800 text-white">
                        <p className="text-xs uppercase tracking-wide font-bold text-indigo-200">Legal</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">Privacy Policy</h1>
                        <p className="text-sm text-indigo-100 mt-4">Last updated: {LAST_UPDATED}</p>
                    </div>

                    <div className="px-8 py-10 space-y-8 text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
                            <p>
                                We collect account details (such as email), subscription metadata, and files/text you submit to generate
                                resumes and cover letters. We also collect operational logs needed for security and performance.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Information</h2>
                            <p>
                                We use your data to provide core features, maintain service quality, prevent abuse, support billing,
                                and improve product reliability. We do not sell your personal information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Retention</h2>
                            <p>
                                We retain data while your account is active or as needed for legal, tax, fraud prevention, and
                                security obligations. You can request deletion using our support channels.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Sharing & Processors</h2>
                            <p>
                                We use vetted infrastructure providers for hosting, authentication, analytics, and payments.
                                Data is shared only as needed to deliver and secure the service.
                            </p>
                        </section>

                        <section id="cookies">
                            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Cookies</h2>
                            <p>
                                Cookies and similar technologies are used for authentication, session continuity, security, and basic
                                product analytics. You can manage cookies through browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Your Rights</h2>
                            <p>
                                Depending on your jurisdiction, you may have rights to access, correct, delete, or export personal
                                data, and to object to certain processing activities.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Policy Updates</h2>
                            <p>
                                We may update this policy to reflect legal, technical, or product changes. The latest version will
                                always be shown on this page with an updated effective date.
                            </p>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Privacy Contact</h2>
                            <p className="text-sm">
                                Privacy requests can be sent to{' '}
                                <a href="mailto:privacy@resumeai.app" className="font-semibold text-blue-700 hover:underline">
                                    privacy@resumeai.app
                                </a>
                                .
                            </p>
                            <p className="text-sm mt-2">
                                For broader questions, visit <Link href="/contact" className="font-semibold text-blue-700 hover:underline">Contact</Link>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    )
}
