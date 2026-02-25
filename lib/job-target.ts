const ROLE_KEYWORDS =
  /\b(engineer|developer|manager|designer|analyst|architect|scientist|consultant|specialist|administrator|coordinator|lead|director|intern|associate|technician|programmer|recruiter|marketer|writer|editor|accountant|sales|qa|sre|devops|support|operations|product|project|security)\b/i

const GENERIC_TITLES = new Set([
  'job description',
  'job posting',
  'job target',
  'target role',
  'role',
  'position',
  'opening',
  'opportunity',
])

const GENERIC_URL_SEGMENTS = new Set([
  'job',
  'jobs',
  'career',
  'careers',
  'position',
  'positions',
  'posting',
  'openings',
  'opportunity',
  'opportunities',
  'details',
  'detail',
  'view',
  'apply',
  'listing',
  'listings',
])

const UPPERCASE_TOKENS = new Set([
  'ai',
  'ml',
  'nlp',
  'qa',
  'ui',
  'ux',
  'sre',
  'seo',
  'sql',
  'aws',
  'gcp',
  'api',
  'saas',
  'b2b',
  'b2c',
])

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function sanitizeTitleCandidate(raw: string): string {
  let value = normalizeWhitespace(raw)
  value = value.replace(/^[-*•]\s*/, '')
  value = value.replace(/^(?:job\s*)?(?:title|role|position)\s*[:\-]\s*/i, '')
  value = value.replace(/\s*[|]\s.*$/, '')
  value = value.replace(/\s+[-–]\s+(?:remote|hybrid|on[- ]?site|full[- ]?time|part[- ]?time|contract|internship).*/i, '')
  value = value.replace(/\s+\((?:remote|hybrid|on[- ]?site|full[- ]?time|part[- ]?time|contract|internship).*\)\s*$/i, '')
  return value.trim()
}

function hasDisallowedSignals(value: string): boolean {
  return (
    /^(dear|hello|hi)\b/i.test(value) ||
    /\b(hiring manager|responsibilities|requirements|qualifications|about us|apply now)\b/i.test(value) ||
    /[.!?]$/.test(value)
  )
}

function isLikelyJobTitle(value: string): boolean {
  if (!value) return false
  const cleaned = sanitizeTitleCandidate(value)
  if (!cleaned) return false

  const lower = cleaned.toLowerCase()
  if (GENERIC_TITLES.has(lower)) return false
  if (hasDisallowedSignals(cleaned)) return false

  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 12) return false
  if (cleaned.length < 4 || cleaned.length > 90) return false

  return ROLE_KEYWORDS.test(cleaned)
}

function toDisplayCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const lower = token.toLowerCase()
      if (UPPERCASE_TOKENS.has(lower)) return lower.toUpperCase()
      if (/^[a-z]$/i.test(token)) return token.toUpperCase()
      return token.charAt(0).toUpperCase() + token.slice(1)
    })
    .join(' ')
}

function extractFromAnalysis(analysis: unknown): string | null {
  if (!analysis || typeof analysis !== 'object') return null

  const raw = analysis as Record<string, unknown>
  const metadata = raw.metadata && typeof raw.metadata === 'object'
    ? raw.metadata as Record<string, unknown>
    : null
  const value = metadata?.job_title

  if (typeof value !== 'string') return null
  const cleaned = sanitizeTitleCandidate(value)
  return isLikelyJobTitle(cleaned) ? cleaned : null
}

export function formatJobHost(rawUrl?: string | null): string | null {
  if (!rawUrl) return null
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function extractJobTitleFromJobText(jobText?: string | null): string | null {
  if (!jobText) return null

  const lines = normalizeWhitespace(jobText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines.slice(0, 30)) {
    const match = line.match(/^(?:job\s*)?(?:title|role|position)\s*[:\-]\s*(.+)$/i)
    if (!match?.[1]) continue
    const candidate = sanitizeTitleCandidate(match[1])
    if (isLikelyJobTitle(candidate)) return candidate
  }

  for (const line of lines.slice(0, 40)) {
    const candidate = sanitizeTitleCandidate(line)
    if (isLikelyJobTitle(candidate)) return candidate
  }

  const inlineMatch = jobText.match(
    /\b(?:hiring|seeking|looking for)\s+(?:an?\s+|the\s+)?([A-Za-z0-9&/+., -]{4,90}?)(?:\s+(?:role|position))\b/i
  )
  if (inlineMatch?.[1]) {
    const candidate = sanitizeTitleCandidate(inlineMatch[1])
    if (isLikelyJobTitle(candidate)) return candidate
  }

  return null
}

function extractJobTextSnippet(jobText?: string | null): string | null {
  if (!jobText) return null

  const lines = normalizeWhitespace(jobText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines.slice(0, 50)) {
    if (/^(dear|hello|hi)\b/i.test(line)) continue
    if (/\b(responsibilities|requirements|qualifications|about us)\b/i.test(line)) continue

    const cleaned = sanitizeTitleCandidate(line)
    if (!cleaned || cleaned.length < 10) continue

    const collapsed = cleaned.replace(/\s+/g, ' ')
    return collapsed.length > 72 ? `${collapsed.slice(0, 69).trimEnd()}...` : collapsed
  }

  return null
}

export function extractJobTitleFromJobUrl(jobUrl?: string | null): string | null {
  if (!jobUrl) return null

  try {
    const url = new URL(jobUrl)
    const segments = url.pathname.split('/').filter(Boolean).reverse()

    for (const segment of segments) {
      let decoded = segment
      try {
        decoded = decodeURIComponent(segment)
      } catch {
        decoded = segment
      }

      const lowerSegment = decoded.toLowerCase()
      if (GENERIC_URL_SEGMENTS.has(lowerSegment)) continue

      const cleaned = sanitizeTitleCandidate(
        decoded
          .replace(/[-_]+/g, ' ')
          .replace(/\b\d+\b/g, ' ')
      )

      if (!isLikelyJobTitle(cleaned)) continue
      return toDisplayCase(cleaned)
    }
  } catch {
    return null
  }

  return null
}

interface ResolveJobTargetInput {
  jobText?: string | null
  jobUrl?: string | null
  analysis?: unknown
  fallbackLabel?: string
}

export function resolveJobTargetLabel({
  jobText,
  jobUrl,
  analysis,
  fallbackLabel = 'Job Target',
}: ResolveJobTargetInput): string {
  return (
    extractFromAnalysis(analysis) ||
    extractJobTitleFromJobText(jobText) ||
    extractJobTitleFromJobUrl(jobUrl) ||
    extractJobTextSnippet(jobText) ||
    formatJobHost(jobUrl) ||
    fallbackLabel
  )
}
