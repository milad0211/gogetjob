// ─────────────────────────────────────────────────────────────
// Centralized Site Configuration
// All brand info, URLs, and SEO defaults in one place.
// Change values here (or via env vars) — every page picks them up.
// ─────────────────────────────────────────────────────────────

/** Base URL of the deployed site (no trailing slash). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://gogetjob.vercel.app'

/** Human-readable product / brand name. */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'GoGetJob'

/** One-liner tagline for SEO and hero sections. */
export const SITE_TAGLINE =
  'AI Resume Optimizer That Gets You Hired'

/** Longer description for meta tags. */
export const SITE_DESCRIPTION =
  'Tailor your resume to every job posting with AI-powered ATS optimization, keyword gap analysis, match scoring, and cover letter generation. Land more interviews, faster.'

/** Google Analytics Measurement ID — leave empty to disable tracking. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

/** Support / contact email shown on public pages. */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'milad.mashayekhi1@gmail.com'

/** Copyright year shown in footer. */
export const COPYRIGHT_YEAR = new Date().getFullYear()

/** All public routes for sitemap generation. */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/privacy-policy',
  '/terms',
  '/contact',
] as const
