'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CheckCircle, ArrowRight, Star, Zap, LayoutTemplate, XCircle, ChevronDown, ChevronRight, Menu, X, ShieldCheck, TrendingUp, Users } from 'lucide-react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index)
  }

  const testimonials = [
    {
      text: "I applied to 50 jobs with no response. After using ResumeAI, I got 3 interviews in one week. It really works!",
      author: "Sarah J.",
      role: "Product Manager at TechFlow",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      text: "The ATS gap analysis is a game changer. It told me exactly which keywords I was missing for the Senior Dev role.",
      author: "Michael T.",
      role: "Senior Engineer at DevCorp",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
      text: "Simple, fast, and effective. I love that it keeps my history so I can see what I sent to whom.",
      author: "Jessica L.",
      role: "UX Designer at CreativeMinds",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica"
    },
    {
      text: "I was skeptical about AI writers, but this one actually sounds like me, just more professional.",
      author: "David K.",
      role: "Marketing Director",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
    },
    {
      text: "Worth every penny of the subscription. I landed a job with a 40% salary increase.",
      author: "Emily R.",
      role: "Data Analyst",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen overflow-x-hidden selection:bg-blue-100">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">R</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">ResumeAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-blue-600 transition">Why It Matters</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
            <a href="#testimonials" className="hover:text-blue-600 transition">Stories</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Log in
            </Link>
            <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-6 flex flex-col gap-4 shadow-xl">
            <a href="#problem" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Why It Matters</a>
            <a href="#how-it-works" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#testimonials" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Stories</a>
            <a href="#pricing" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <hr className="border-slate-100 my-2" />
            <Link href="/login" className="text-lg font-medium text-blue-600" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link href="/login" className="bg-blue-600 text-white text-center py-3 rounded-xl font-bold" onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-200/20 rounded-[100%] blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-100/30 rounded-[100%] blur-3xl -z-10"></div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-8 animate-fade-in-up shadow-sm hover:shadow-md transition cursor-default">
            <Star size={14} className="fill-blue-700" />
            <span>Trusted by 10,000+ Job Seekers</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1] animate-fade-in-up [animation-delay:200ms]">
            Beat the ATS. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Land the Interview.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed animate-fade-in-up [animation-delay:400ms]">
            75% of resumes are rejected by robots. Our AI rewrites your resume to match the job description keywords perfectly, in seconds.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 animate-fade-in-up [animation-delay:600ms]">
            <Link href="/login" className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/40">
              Optimize My Resume <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </Link>
            <a href="#how-it-works" className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-xl text-lg font-bold transition shadow-sm hover:shadow-md">
              See How It Works
            </a>
          </div>

          <div className="animate-fade-in-up [animation-delay:800ms] opacity-60">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Candidates hired at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-70">
              {['Google', 'Microsoft', 'Spotify', 'Amazon', 'Tesla'].map(name => (
                <span key={name} className="font-bold text-xl text-slate-800">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAIN & SOLUTION */}
      <section id="problem" className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why you're not getting calls back</h2>
            <p className="text-lg text-slate-600">The hiring process is broken. We fixed it.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-stretch">
            {/* Problem */}
            <div className="bg-red-50/50 p-8 md:p-10 rounded-3xl border border-red-100 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <XCircle size={28} />
                </div>
                <h3 className="text-2xl font-bold text-red-900">The Problem</h3>
              </div>
              <ul className="space-y-6 flex-1">
                {[
                  "Generic resumes are ignored by ATS software",
                  "Missing keywords = automatic rejection",
                  "Hours spent tweaking resumes manually",
                  "Formatting errors confuse parsing robots"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-slate-700 font-medium">
                    <span className="mt-2 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-green-50/80 p-8 md:p-10 rounded-3xl border border-green-200 shadow-xl relative flex flex-col transform md:scale-105 z-10">
              <div className="absolute -top-5 right-8 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg border-2 border-white">
                THE FIX
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-2xl font-bold text-green-900">The Solution</h3>
              </div>
              <ul className="space-y-6 flex-1">
                {[
                  "AI injects exact keywords from the job description",
                  "Instant Gap Analysis shows what you are missing",
                  "Perfectly formatted PDF generated in seconds",
                  "Tailored specifically for THAT single job role"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-slate-800 font-bold">
                    <div className="mt-0.5 bg-green-200 p-0.5 rounded-full">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">3 Steps to Your Dream Job</h2>
            <p className="text-lg text-slate-600">No complex resume builders. Just upload, paste, and download.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: LayoutTemplate, title: "1. Upload Resume", desc: "Drag & drop your current PDF. We strip the text and analyze your baseline.", step: "01" },
              { icon: Zap, title: "2. Paste Job Link", desc: "Paste the job description URL or text. Our AI finds the hidden requirements.", step: "02" },
              { icon: Star, title: "3. Download & Apply", desc: "Get a new, score-optimized PDF ready to bypass the ATS filters.", step: "03" }
            ].map((step, i) => (
              <div key={i} className="group bg-white p-8 pt-12 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl font-black font-sans text-slate-900 select-none group-hover:opacity-10 transition">
                  {step.step}
                </div>
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS CAROUSEL */}
      <section id="testimonials" className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-slate-600">Real results from real job seekers.</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-4">
                    <div className="bg-slate-50 p-10 md:p-14 rounded-3xl border border-slate-100 text-center">
                      <div className="flex justify-center gap-1 mb-6 text-yellow-400">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={20} fill="currentColor" />)}
                      </div>
                      <p className="text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed">"{t.text}"</p>
                      <div className="flex flex-col items-center justify-center gap-4">
                        <img src={t.image} alt={t.author} className="w-14 h-14 rounded-full bg-slate-200" />
                        <div>
                          <div className="font-bold text-slate-900 text-lg">{t.author}</div>
                          <div className="text-sm text-slate-500">{t.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-3 h-3 rounded-full transition-all ${i === activeTestimonial ? 'bg-blue-600 w-6' : 'bg-slate-300 hover:bg-slate-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
            <p className="text-lg text-slate-600">Invest in your career for less than the cost of a dinner.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:border-blue-200 transition relative">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                <p className="text-slate-500 mb-6">Perfect for testing the waters.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">$0</span>
                  <span className="text-slate-500">/ forever</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "3 Resume Generations (Lifetime)",
                  "Basic Keyword Matching",
                  "Standard PDF Download",
                  "Standard Templates"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle size={18} className="text-blue-600 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl transition text-center">
                Get Started Free
              </Link>
            </div>

            {/* Pro Monthly */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-blue-200 flex flex-col relative hover:border-blue-400 transition">
              <div className="absolute -top-4 right-8 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-slate-50 shadow-sm text-center">
                POPULAR
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Pro Monthly</h3>
                <p className="text-slate-500 mb-6">For active job seekers.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">$50</span>
                  <span className="text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Cancel anytime.</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "30 Resume Generations / Month",
                  "Advanced Gap Analysis & Scoring",
                  "Cover Letter Generator",
                  "Priority Support",
                  "Premium Templates"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle size={18} className="text-blue-600 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-500/20 text-center hover:scale-[1.02]">
                Subscribe Monthly
              </Link>
            </div>

            {/* Pro Yearly */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 text-white flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>
              <div className="absolute -top-4 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-slate-50 shadow-sm text-center">
                BEST VALUE
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Pro Yearly</h3>
                <p className="text-slate-400 mb-6">For career changers & power users.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold">$400</span>
                  <span className="text-slate-400">/ year</span>
                </div>
                <p className="text-xs text-green-400 mt-2 font-bold">Save 33% vs Monthly!</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "360 Resume Generations / Year",
                  "All Pro Monthly Features",
                  "Exclusive Recruiter-Approved Templates",
                  "Priority Support",
                  "Competitor Keyword Insights"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle size={18} className="text-indigo-400 flex-shrink-0" />
                    <span className={i > 2 ? "font-semibold text-white" : ""}>{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-500/30 text-center hover:scale-[1.02]">
                Subscribe Yearly — Save 33%
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Why can't I just use ChatGPT?",
                a: "ChatGPT gives generic advice and often hallucinates experience. We specifically analyze the *missing* keywords from the job description and format them into a perfectly structured PDF that passes ATS scanners without you needing to prompt engineer."
              },
              {
                q: "Does it work for all industries?",
                a: "Yes! Whether you are in Tech, Marketing, Finance, or Healthcare, our AI adapts the tone and keywords to match your target role's specific language requirements."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We do not sell your personal data. Your resumes are stored securely and you can delete them at any time."
              },
              {
                q: "Can I cancel my subscription easily?",
                a: "Yes. One click in your dashboard cancels the renewal. You keep access until the end of your billing period."
              }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-blue-200">
                <button
                  onClick={() => toggleAccordion(i)}
                  className="flex justify-between items-center w-full p-6 text-left bg-white hover:bg-slate-50 transition"
                >
                  <span className="font-bold text-lg text-slate-900">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform duration-300 ${activeAccordion === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${activeAccordion === i ? 'max-h-48' : 'max-h-0'}`}
                >
                  <p className="p-6 pt-0 text-slate-600 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-white mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">R</div>
              <span className="text-xl font-bold">ResumeAI</span>
            </div>
            <p className="text-sm text-slate-500 mb-6">Helping job seekers land their dream jobs with AI-powered resume optimization.</p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-slate-700 transition"></div>
              <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-slate-700 transition"></div>
              <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-slate-700 transition"></div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#testimonials" className="hover:text-white transition">Success Stories</a></li>
              <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/privacy-policy#cookies" className="hover:text-white transition">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© 2026 ResumeAI. All rights reserved.</p>
          <p>Made with ❤️ for job seekers everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
