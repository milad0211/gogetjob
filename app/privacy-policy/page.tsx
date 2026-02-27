import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { SITE_NAME } from '@/lib/config'

const LAST_UPDATED = 'February 25, 2026'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read how GoGetJob collects, uses, stores, and protects data across account, billing, and generation workflows.',
}

const HIGHLIGHTS = [
  'We do not sell personal data.',
  'You can request access, correction, export, or deletion.',
  'Data is processed to operate core product features and security controls.',
]

const SECTIONS = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    body: 'We collect account details, subscription metadata, and content you submit for resume or cover letter generation. We also collect operational logs required for reliability, fraud prevention, and service monitoring.',
  },
  {
    id: 'how-we-use-data',
    title: '2. How We Use Information',
    body: 'Data is used to provide product functionality, support billing and account operations, enforce limits, improve output reliability, and maintain security. Processing is limited to product and legal obligations.',
  },
  {
    id: 'retention',
    title: '3. Data Retention',
    body: 'We retain data while your account is active and for additional periods where required for legal compliance, billing records, abuse prevention, and security investigations.',
  },
  {
    id: 'sharing-and-processors',
    title: '4. Sharing and Processors',
    body: 'We rely on infrastructure partners for hosting, authentication, and payments. Data is shared only as necessary to deliver and secure the service, and not sold for third-party advertising.',
  },
  {
    id: 'cookies',
    title: '5. Cookies and Similar Technologies',
    body: 'Cookies support authentication, session continuity, and basic analytics. You can control cookie behavior in browser settings, but disabling them may affect essential product functionality.',
  },
  {
    id: 'your-rights',
    title: '6. Your Rights',
    body: 'Depending on your jurisdiction, you may request access, correction, deletion, export, or objection to specific processing activities. We verify ownership before processing privacy requests.',
  },
  {
    id: 'policy-updates',
    title: '7. Policy Updates',
    body: 'We may update this policy as product, legal, or security requirements evolve. Material updates are reflected on this page with an updated effective date.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-lg font-bold text-slate-900">{SITE_NAME}</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">← Back to Home</Link>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute -top-24 -right-14 h-64 w-64 rounded-full bg-teal-200/35 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-200/35 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
            Legal
          </p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Transparent data handling is core to product trust. This page explains what data is processed and why.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-500">Last updated: {LAST_UPDATED}</p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <CheckCircle2 size={16} />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">On this page</p>
            <ul className="mt-3 space-y-2 text-sm">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-slate-700 transition hover:text-teal-700">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white shadow-sm">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-200">
              Privacy contact
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              For privacy requests, contact us directly by email.
            </p>
            <a
              href="mailto:milad.mashayekhi1@gmail.com"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-teal-200"
            >
              milad.mashayekhi1@gmail.com
              <ArrowRight size={14} />
            </a>
          </div>
        </aside>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <article key={section.id} id={section.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-slate-700">{section.body}</p>
            </article>
          ))}

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldCheck size={18} className="text-teal-700" />
              Need legal details for your procurement review?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              If you need additional privacy clarifications before purchase, use the Contact page and include your organization name and review scope.
            </p>
            <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800">
              Open Contact Page
              <ArrowRight size={14} />
            </Link>
          </section>
        </div>
      </section>
    </main>
  )
}
