import Link from 'next/link'
import { Mail, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react'

const CONTACT_CHANNELS = [
    {
        title: 'General Support',
        description: 'Product issues, billing questions, and account help.',
        email: 'support@resumeai.app',
        icon: MessageSquare,
        tone: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700',
    },
    {
        title: 'Sales & Partnerships',
        description: 'Team plans, affiliate partnerships, and B2B questions.',
        email: 'partnerships@resumeai.app',
        icon: Mail,
        tone: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700',
    },
    {
        title: 'Privacy & Security',
        description: 'Data requests, security disclosures, and compliance.',
        email: 'privacy@resumeai.app',
        icon: ShieldCheck,
        tone: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700',
    },
]

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-slate-50">
            <section className="relative overflow-hidden border-b border-slate-200 bg-white">
                <div className="absolute -top-28 -right-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl" />
                <div className="max-w-6xl mx-auto px-6 py-20 relative">
                    <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                        Contact
                    </p>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mt-5">
                        Talk to the ResumeAI team
                    </h1>
                    <p className="mt-4 max-w-2xl text-slate-600 text-lg leading-relaxed">
                        Reach us through the channel that matches your request. We typically answer within one business day.
                    </p>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 py-14">
                <div className="grid md:grid-cols-3 gap-6">
                    {CONTACT_CHANNELS.map((channel) => (
                        <article
                            key={channel.title}
                            className={`rounded-3xl border bg-gradient-to-br p-6 shadow-sm ${channel.tone}`}
                        >
                            <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center mb-4">
                                <channel.icon size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{channel.title}</h2>
                            <p className="text-sm text-slate-600 mt-2 mb-5 leading-relaxed">{channel.description}</p>
                            <a
                                href={`mailto:${channel.email}`}
                                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-blue-700 transition"
                            >
                                {channel.email} <ArrowRight size={14} />
                            </a>
                        </article>
                    ))}
                </div>

                <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900">Need immediate account access?</h3>
                    <p className="text-slate-600 mt-2 mb-5">
                        Log in and open your dashboard to manage subscription, usage, and resume history in real time.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
                    >
                        Open Dashboard <ArrowRight size={14} />
                    </Link>
                </div>
            </section>
        </main>
    )
}
