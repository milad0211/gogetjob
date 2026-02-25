import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  Clock,
  Crown,
  FileText,
  Gauge,
  GitCompareArrows,
  LayoutTemplate,
  LineChart,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import {
  getCoverLetterProMonthlyLimit,
  getCoverLetterProYearlyLimit,
  getResumeFreeLimit,
  getResumeProMonthlyLimit,
  getResumeProYearlyLimit,
} from '@/lib/subscription'

export const metadata: Metadata = {
  title: 'ResumeAI - ATS Resume Optimizer for Faster Interview Calls',
  description:
    'Upload your resume, paste a job description, and get a factual, ATS-focused rewrite with keyword gap analysis, before/after scoring, and downloadable PDF output.',
  keywords: [
    'ATS resume optimizer',
    'AI resume builder',
    'resume keyword matching',
    'resume score checker',
    'cover letter generator',
    'job description resume tailoring',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ResumeAI - ATS Resume Optimizer',
    description:
      'Improve resume-job match with AI rewrite, score breakdown, quality checks, and clean PDF export.',
    url: '/',
    siteName: 'ResumeAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeAI - ATS Resume Optimizer',
    description:
      'Tailor every resume to each role with quality-gated AI rewrite and measurable score improvement.',
  },
}

const outcomeCards = [
  {
    name: 'Maya R.',
    role: 'Backend Engineer, 5 years',
    context: 'Applied to 12 roles with one generic resume and got no replies in three weeks.',
    action: 'Tailored three role-specific versions with ATS mode and reordered evidence bullets.',
    outcome: 'Received 2 recruiter screens in 9 days. Score moved from 57 to 75.',
    quote: 'The biggest difference was clarity. Each resume felt written for that exact role.',
  },
  {
    name: 'Liam T.',
    role: 'Product Marketing Manager',
    context: 'Was struggling to position cross-functional achievements for SaaS growth roles.',
    action: 'Used gap analysis plus cover letter generation for six target applications.',
    outcome: 'Got 3 interview invitations in 14 days. Score moved from 52 to 73.',
    quote: 'It helped me translate my experience into the language hiring teams expected.',
  },
  {
    name: 'Kevin D.',
    role: 'Data Analyst',
    context: 'Had solid analytics projects, but low match scores for BI-heavy job posts.',
    action: 'Focused on missing phrase coverage and impact clarity in bullet rewrites.',
    outcome: 'Received 2 interviews in 11 days. Score moved from 61 to 77.',
    quote: 'The score breakdown showed exactly what to fix instead of guessing.',
  },
]

const precisionDetails = [
  {
    title: 'Evidence-locked rewriting',
    description:
      'The engine keeps role, company, date, school, and factual entities anchored to source evidence before output is accepted.',
  },
  {
    title: 'Quality gate before delivery',
    description:
      'Every output is validated for fact preservation, skill injection, metric integrity, section retention, and bullet quality.',
  },
  {
    title: 'Safe mode fallback',
    description:
      'If confidence is low or quality checks fail, the system switches to safe output to reduce risky AI behavior.',
  },
  {
    title: 'Before/after score breakdown',
    description:
      'Users can inspect improvements across keyword coverage, structure hygiene, relevance evidence, and impact clarity.',
  },
]

const firstRunChecklist = [
  'One existing resume PDF (up to 5MB)',
  'One job description URL or pasted text',
  '10-20 seconds for first optimization output',
]

const fitSegments = [
  {
    icon: BriefcaseBusiness,
    title: 'High-volume applicants',
    subtitle: 'Weekly applications',
    description: 'Apply to several roles each week with role-specific versions instead of one generic file.',
    highlight: 'Reduces manual tailoring time while preserving factual credibility.',
  },
  {
    icon: GitCompareArrows,
    title: 'Career transition candidates',
    subtitle: 'Transferable positioning',
    description: 'Translate adjacent experience into role language recruiters and ATS systems recognize faster.',
    highlight: 'Helps bridge domain shifts without inventing skills or achievements.',
  },
  {
    icon: LineChart,
    title: 'Score-driven optimizers',
    subtitle: 'Measured iteration',
    description: 'Review score deltas before applying so every version is improved with intent.',
    highlight: 'Turns resume optimization into a repeatable feedback loop.',
  },
]

const faqs = [
  {
    question: 'What makes this different from a generic AI prompt?',
    answer:
      'ResumeAI is not a single prompt wrapper. It runs parsing, job requirement extraction, gap analysis, rewrite, and a quality gate with safe fallback before returning output.',
  },
  {
    question: 'Does it invent experience or skills?',
    answer:
      'The pipeline is designed to prevent that. Output is checked for injected skills, unverifiable metrics, and changed factual entities. Unsafe output is rejected or downgraded to safe mode.',
  },
  {
    question: 'Can I use job URLs or pasted descriptions?',
    answer:
      'Yes. You can paste a job URL or paste the job text directly. If a website blocks scraping, the app asks you to paste text instead.',
  },
  {
    question: 'Do I need a credit card to start?',
    answer:
      'No. You can start on the Starter plan without entering payment information.',
  },
  {
    question: 'How does billing work for Pro plans?',
    answer:
      'Monthly and yearly plans are subscription-based. You can cancel anytime from the dashboard and keep access until the current billing period ends.',
  },
  {
    question: 'What happens to my resume data?',
    answer:
      'Your content is used to run generation and product functionality. Privacy details and data handling terms are published in the Privacy Policy page.',
  },
  {
    question: 'Does it support only English resumes?',
    answer:
      'No. The parser is built to work with multilingual resumes, including Persian and English content.',
  },
  {
    question: 'How are limits handled?',
    answer:
      'Quota is reserved atomically before generation, tracked in your dashboard, and released automatically on failed runs to keep usage accurate.',
  },
]

export default function Home() {
  const freeResumeLimit = getResumeFreeLimit()
  const proResumeMonthlyLimit = getResumeProMonthlyLimit()
  const proResumeYearlyLimit = getResumeProYearlyLimit()
  const proCoverLetterMonthlyLimit = getCoverLetterProMonthlyLimit()
  const proCoverLetterYearlyLimit = getCoverLetterProYearlyLimit()

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ResumeAI',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'ATS-focused resume optimization platform with AI rewrite, keyword gap analysis, quality checks, and cover letter generation.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '0',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'Pro Monthly',
        price: '50',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'Pro Yearly',
        price: '400',
        priceCurrency: 'USD',
      },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <Script id="software-schema" type="application/ld+json">
        {JSON.stringify(softwareSchema)}
      </Script>
      <Script id="faq-schema" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>

      <div className="bg-slate-50 text-slate-900">
        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                R
              </div>
              <span className="text-lg font-bold tracking-tight">
                ResumeAI
              </span>
            </Link>

            <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
              <a href="#why" className="transition hover:text-slate-900">
                Why
              </a>
              <a href="#how" className="transition hover:text-slate-900">
                How it works
              </a>
              <a href="#testimonials" className="transition hover:text-slate-900">
                Results
              </a>
              <a href="#precision" className="transition hover:text-slate-900">
                Precision
              </a>
              <a href="#pricing" className="transition hover:text-slate-900">
                Pricing
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Start free
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </nav>

        <header className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-amber-200/35 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pb-24 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                <ShieldCheck size={14} />
                Engine v3 with quality-gated output
              </p>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Stop sending generic resumes.
                <span className="block text-teal-700">Start sending role-matched evidence.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                ResumeAI helps you tailor each resume to each job description with measurable before/after score changes,
                safer fact handling, and ATS-ready PDF exports.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-bold text-white transition hover:bg-teal-700"
                >
                  Optimize my resume
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  See the workflow
                </a>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                No credit card required for Starter. First result usually in under 20 seconds.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Free plan</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{freeResumeLimit}</p>
                  <p className="text-xs text-slate-500">lifetime resume runs</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output modes</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">2 PDFs</p>
                  <p className="text-xs text-slate-500">ATS and premium layout</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score model</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">4D</p>
                  <p className="text-xs text-slate-500">keyword, structure, evidence, impact</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Live optimization preview</p>
                  <p className="text-xl font-bold text-slate-900">
                    ATS Match Improvement
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Quality: Passed</span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Before optimization</span>
                    <span>58%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 w-[58%] rounded-full bg-slate-400" />
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span>After optimization</span>
                    <span>79% (+21)</span>
                  </div>
                  <div className="h-2 rounded-full bg-emerald-200/80">
                    <div className="h-2 w-[79%] rounded-full bg-emerald-500" />
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    Missing keywords surfaced and prioritized by impact
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    Role, company, dates, and links preserved by validation layer
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    ATS PDF generated and saved to dashboard history
                  </li>
                </ul>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">What you need for your first run</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {firstRunChecklist.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle size={15} className="mt-0.5 text-teal-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section id="why" className="border-b border-slate-200 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Why good candidates still get filtered out
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                In most pipelines, a recruiter sees your resume only after an ATS filter. If the language and structure do not
                align with the role, you lose the opportunity before human review.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <article className="rounded-3xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
                <h3 className="text-2xl font-bold text-rose-900">What usually goes wrong</h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-rose-900/90 sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                    One generic resume is sent to many roles with different keyword expectations.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Important evidence is buried, while low-signal content gets visual priority.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                    AI-only rewrites can introduce unsupported claims and risky metrics.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                    No clear feedback loop exists to measure quality before applying.
                  </li>
                </ul>
              </article>

              <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
                <h3 className="text-2xl font-bold text-emerald-900">How ResumeAI fixes it</h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-emerald-900/90 sm:text-base">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-700" />
                    Job-specific targeting with extracted requirements and keyword gaps.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-700" />
                    Evidence-aware rewrite that prioritizes relevant bullets and credible outcomes.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-700" />
                    Quality gate checks to reduce hallucinations and preserve original facts.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-700" />
                    Before/after score visibility so users can decide with confidence.
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="how" className="border-b border-slate-200 bg-white py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mb-14 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white sm:p-8">
              <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-200">
                    Product fit
                  </p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Who gets the fastest value from this workflow</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                    If your current process is copy-paste and guesswork, these are the user profiles that usually see quicker interview response lift.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  Built for conversion-focused job search
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {fitSegments.map((segment) => (
                  <article
                    key={segment.title}
                    className="group rounded-2xl border border-white/15 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-teal-200 ring-1 ring-white/20">
                        <segment.icon size={20} />
                      </div>
                      <span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                        {segment.subtitle}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white">{segment.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{segment.description}</p>
                    <p className="mt-3 border-t border-white/10 pt-3 text-xs font-semibold leading-relaxed text-teal-100">{segment.highlight}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                A practical 3-step workflow
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                The product keeps the flow fast: upload, align, export. Most runs complete in about 10-20 seconds.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: LayoutTemplate,
                  title: '1) Upload resume PDF',
                  description: 'Drop your PDF (up to 5MB). The parser extracts structured data and confidence signals.',
                },
                {
                  icon: Zap,
                  title: '2) Add job description',
                  description:
                    'Paste a job URL or text. The analyzer extracts required skills, phrases, and role expectations.',
                },
                {
                  icon: FileText,
                  title: '3) Review and apply',
                  description:
                    'Check score deltas, download ATS or premium PDF, and keep all versions in your dashboard history.',
                },
              ].map((step) => (
                <article key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
                    <step.icon size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="precision" className="border-b border-slate-200 bg-slate-900 py-20 text-white sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-teal-400/40 bg-teal-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-200">
                  <ShieldCheck size={14} />
                  Precision layer
                </p>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                  Details that improve accuracy and trust
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Most tools stop at rewrite generation. ResumeAI continues with validation. That is where reliability comes from.
                </p>

                <div className="mt-7 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                    <Gauge size={18} className="text-teal-300" />
                    <p className="mt-2 font-semibold">4-dimensional scoring</p>
                    <p className="mt-1 text-xs text-slate-300">Keyword, structure, evidence, impact</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                    <Clock size={18} className="text-teal-300" />
                    <p className="mt-2 font-semibold">Usage-safe quota handling</p>
                    <p className="mt-1 text-xs text-slate-300">Atomic reservation with automatic release on failure</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                    <Calendar size={18} className="text-teal-300" />
                    <p className="mt-2 font-semibold">Clear cycle visibility</p>
                    <p className="mt-1 text-xs text-slate-300">Track remaining resume and cover letter usage</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                    <Users size={18} className="text-teal-300" />
                    <p className="mt-2 font-semibold">Multilingual parsing</p>
                    <p className="mt-1 text-xs text-slate-300">Designed for English and Persian resume content</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {precisionDetails.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Positioning in the current market
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Many popular tools focus on resume building scale and broad AI assistance. ResumeAI is optimized for
                role-specific alignment with factual safety and transparent quality checks.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto rounded-3xl border border-slate-200">
              <table className="min-w-full bg-white text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 font-bold">Capability</th>
                    <th className="px-5 py-4 font-bold">Generic builders</th>
                    <th className="px-5 py-4 font-bold">Keyword scanners</th>
                    <th className="px-5 py-4 font-bold">ResumeAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-5 py-4 font-semibold">Fact-preserving rewrite checks</td>
                    <td className="px-5 py-4">Usually limited</td>
                    <td className="px-5 py-4">Not the core workflow</td>
                    <td className="px-5 py-4 font-semibold text-teal-700">Built-in quality gate + safe mode</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-semibold">Before/after score dimensions</td>
                    <td className="px-5 py-4">Often single score or none</td>
                    <td className="px-5 py-4">Keyword-heavy only</td>
                    <td className="px-5 py-4 font-semibold text-teal-700">4-dimensional score breakdown</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-semibold">Role-targeted rewrite + PDF output</td>
                    <td className="px-5 py-4">Yes, template-first</td>
                    <td className="px-5 py-4">Analysis-focused</td>
                    <td className="px-5 py-4 font-semibold text-teal-700">Rewrite + ATS/Premium PDF modes</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-semibold">Usage and billing transparency</td>
                    <td className="px-5 py-4">Varies by provider</td>
                    <td className="px-5 py-4">Varies by provider</td>
                    <td className="px-5 py-4 font-semibold text-teal-700">Cycle-level usage tracking in dashboard</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Market comparison is based on publicly available feature and pricing pages from leading tools as reviewed on February 25, 2026.
            </p>
          </div>
        </section>

        <section id="testimonials" className="border-b border-slate-200 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Outcome snapshots users trust
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Testimonials are shown in a structured format: role target, score delta, response timeline, and workflow used.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {outcomeCards.map((card) => (
                <article key={card.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <Star key={idx} size={14} fill="currentColor" />
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{card.context}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">What changed:</span> {card.action}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-700">{card.outcome}</p>
                  <blockquote className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm italic text-slate-700">
                    &quot;{card.quote}&quot;
                  </blockquote>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="font-semibold text-slate-900">{card.name}</p>
                    <p className="text-sm text-slate-500">{card.role}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Names are abbreviated for privacy. Individual outcomes can vary by role, market timing, and profile strength.
            </p>
          </div>
        </section>

        <section id="pricing" className="border-b border-slate-200 bg-white py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Plans built for real application volume
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Clear limits, no ambiguity. Start free, then scale as your job search intensifies.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Starter requires no card. Pro plans can be canceled from your dashboard billing page.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <article className="flex flex-col rounded-3xl border border-slate-200 bg-slate-50 p-7">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Starter</p>
                <p className="mt-3 text-5xl font-bold text-slate-900">$0</p>
                <p className="mt-1 text-sm text-slate-500">Forever</p>

                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    {freeResumeLimit} resume generations (lifetime)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    ATS match scoring and keyword gap view
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    ATS and premium PDF downloads
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    Dashboard history of generated resumes
                  </li>
                </ul>

                <Link
                  href="/login"
                  className="mt-7 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Start free
                </Link>
              </article>

              <article className="relative flex flex-col rounded-3xl border-2 border-teal-300 bg-white p-7 shadow-xl shadow-teal-100/70">
                <p className="absolute -top-3 left-6 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">Most chosen</p>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pro Monthly</p>
                <p className="mt-3 text-5xl font-bold text-slate-900">$50</p>
                <p className="mt-1 text-sm text-slate-500">per month</p>

                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    {proResumeMonthlyLimit} resume generations per month
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    {proCoverLetterMonthlyLimit} cover letters per month
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    Advanced rewrite plus quality notes
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-teal-600" />
                    Priority support and faster iteration loop
                  </li>
                </ul>

                <Link
                  href="/login"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
                >
                  Upgrade to monthly
                  <ArrowRight size={15} />
                </Link>
              </article>

              <article className="relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900 p-7 text-white">
                <p className="absolute -top-3 left-6 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900">Best value</p>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Pro Yearly</p>
                <p className="mt-3 text-5xl font-bold">$400</p>
                <p className="mt-1 text-sm text-slate-300">per year (about $33/month)</p>

                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-100">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-400" />
                    {proResumeYearlyLimit} resume generations per year
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-400" />
                    {proCoverLetterYearlyLimit} cover letters per year
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-400" />
                    Full Pro feature set with lower blended cost
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-400" />
                    Better fit for active job search phases
                  </li>
                </ul>

                <Link
                  href="/login"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Upgrade to yearly
                  <Crown size={15} />
                </Link>
              </article>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Need policy details before purchase? Review <Link href="/privacy-policy" className="font-semibold text-slate-900 hover:underline">Privacy Policy</Link> and{' '}
              <Link href="/terms" className="font-semibold text-slate-900 hover:underline">Terms of Service</Link>.
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-slate-200 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-4xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Frequently asked questions
            </h2>

            <div className="mt-10 space-y-4">
              {faqs.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-teal-200">
                  <summary className="cursor-pointer list-none font-semibold text-slate-900">
                    <span>{item.question}</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white sm:p-12">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-200">
                    <Sparkles size={14} />
                    Ready to apply smarter
                  </p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                    Turn one resume into job-specific versions that actually compete.
                  </h2>
                  <p className="mt-4 text-slate-300">
                    Start with the free plan. See score movement, inspect the output, then scale when your search volume grows.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-600"
                  >
                    Start for free
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    View plan details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-slate-100 py-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 ResumeAI. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 font-medium">
              <Link href="/privacy-policy" className="hover:text-slate-900">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-900">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-slate-900">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
