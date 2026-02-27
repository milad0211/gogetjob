import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, MessageSquare, Send, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { SITE_NAME } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Contact GoGetJob Support and Sales',
  description:
    'Contact GoGetJob for product support, billing help, privacy requests, and partnership inquiries.',
}

const CONTACT_OPTIONS = [
  {
    title: 'General Support',
    channel: 'Email',
    value: 'milad.mashayekhi1@gmail.com',
    href: 'mailto:milad.mashayekhi1@gmail.com',
    description: 'Product guidance, account access, billing questions, and troubleshooting.',
    sla: 'Typical response: within 1 business day',
    icon: MessageSquare,
    tone: 'from-blue-50 to-sky-50 border-blue-200 text-blue-700',
  },
  {
    title: 'Privacy and Security',
    channel: 'Email',
    value: 'milad.mashayekhi1@gmail.com',
    href: 'mailto:milad.mashayekhi1@gmail.com',
    description: 'Data access, correction, deletion requests, and privacy concerns.',
    sla: 'Handled under policy response timelines',
    icon: ShieldCheck,
    tone: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700',
  },
  {
    title: 'Urgent Clarifications',
    channel: 'Telegram (optional)',
    value: '@Milad_Devmit',
    href: 'https://t.me/Milad_Devmit',
    description: 'For quick operational clarifications. Avoid sharing sensitive personal documents in chat.',
    sla: 'Often same-day during active hours',
    icon: Send,
    tone: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700',
  },
]

const QUICK_START_CHECKLIST = [
  'Include your account email in the message for faster handling.',
  'Share the affected page and action steps if reporting a bug.',
  'If billing-related, include subscription plan and invoice date.',
]

export default function ContactPage() {
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
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
            Contact
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Talk to a real person when you need help moving faster
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Pick the contact channel that matches your need. We keep support practical, fast, and focused on getting you back to applying.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
            <Clock3 size={16} className="text-slate-500" />
            Most support requests are answered within one business day.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {CONTACT_OPTIONS.map((option) => (
            <article key={option.title} className={`rounded-3xl border bg-gradient-to-br p-6 shadow-sm ${option.tone}`}>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/80">
                <option.icon size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{option.channel}</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">{option.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{option.description}</p>
              <a
                href={option.href}
                target={option.href.startsWith('http') ? '_blank' : undefined}
                rel={option.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-900 transition hover:text-teal-700"
              >
                {option.value}
                <ArrowRight size={14} />
              </a>
              <p className="mt-3 text-xs font-medium text-slate-500">{option.sla}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-2">
            <h3 className="text-xl font-bold text-slate-900">Before you message us</h3>
            <p className="mt-2 text-sm text-slate-600">
              This small checklist helps us resolve requests in fewer back-and-forths.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              {QUICK_START_CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-teal-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white shadow-sm">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-200">
              Fast track
            </p>
            <h3 className="mt-4 text-xl font-bold">Already signed up?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Open your dashboard to check plan limits, generation history, and billing status before contacting support.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-600"
            >
              Open Dashboard
              <ArrowRight size={14} />
            </Link>
          </section>
        </div>
      </section>
    </main>
  )
}
