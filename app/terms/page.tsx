import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Scale } from 'lucide-react'

const LAST_UPDATED = 'February 25, 2026'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the terms that govern access, subscriptions, billing, usage limits, and legal responsibilities for ResumeAI.',
}

const HIGHLIGHTS = [
  'AI outputs improve alignment but do not guarantee hiring outcomes.',
  'Subscriptions can be canceled from dashboard billing settings.',
  'Users remain responsible for lawful and accurate platform use.',
]

const SECTIONS = [
  {
    id: 'service-scope',
    title: '1. Service Scope',
    body: 'ResumeAI provides AI-assisted resume optimization, analysis insights, and optional cover letter generation. Product output is assistive and does not guarantee interviews, offers, or employment outcomes.',
  },
  {
    id: 'account-responsibilities',
    title: '2. Account Responsibilities',
    body: 'You are responsible for safeguarding login access and for all activity under your account. You must provide accurate account details and keep them current.',
  },
  {
    id: 'acceptable-use',
    title: '3. Acceptable Use',
    body: 'You may not use the service for unlawful, deceptive, abusive, or fraudulent activity. Attempts to bypass limits, exploit security controls, or reverse engineer protected systems are prohibited.',
  },
  {
    id: 'subscriptions-billing',
    title: '4. Subscriptions and Billing',
    body: 'Paid plans renew automatically until canceled. Cancellation can be performed from dashboard billing controls. Access remains active until the end of the current paid period.',
  },
  {
    id: 'intellectual-property',
    title: '5. Intellectual Property',
    body: 'You retain rights in your submitted content. The platform software, models, user interface, and related service components remain the property of ResumeAI and its licensors.',
  },
  {
    id: 'disclaimer-liability',
    title: '6. Disclaimer and Liability',
    body: 'The service is provided on an as-is basis. To the extent permitted by applicable law, ResumeAI disclaims implied warranties and is not liable for indirect or consequential damages arising from use of the service.',
  },
  {
    id: 'updates',
    title: '7. Updates to Terms',
    body: 'We may revise these terms as product or legal conditions change. Material changes are published on this page with a revised effective date.',
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
            Legal
          </p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Terms of Service</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            These terms explain how the service works, what users can expect, and how subscription and usage policies are handled.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-500">Last updated: {LAST_UPDATED}</p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
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
              Legal contact
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Questions about these terms can be submitted by email.
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
              <Scale size={18} className="text-teal-700" />
              Need policy confirmation before upgrading?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              For procurement or legal review, contact us with your questions and required clauses so we can respond clearly.
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
