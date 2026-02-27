'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { SITE_NAME } from '@/lib/config'

const NAV_LINKS = [
  { href: '#why', label: 'Why' },
  { href: '#how', label: 'How it works' },
  { href: '#testimonials', label: 'Results' },
  { href: '#precision', label: 'Precision' },
  { href: '#pricing', label: 'Pricing' },
]

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-lg font-bold tracking-tight">{SITE_NAME}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
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

        {/* Mobile: CTA + Hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Start free
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 md:hidden animate-slide-down">
          <div className="space-y-1 pt-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Log in
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Start free
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
