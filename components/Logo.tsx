/**
 * GoGetJob Logo Component
 * Premium inline SVG logo — no external assets needed.
 * Uses teal gradient with upward arrow (career growth) + checkmark (ATS pass).
 */

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-label="GoGetJob logo"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="logo-arrow" x1="20" y1="44" x2="44" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-bg)" />
      <path d="M32 14L44 30H37V46H27V30H20L32 14Z" fill="url(#logo-arrow)" />
      <path
        d="M24 48L28 52L40 40"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

/** Compact wordmark: logo icon + brand text */
export function LogoMark({ size = 32, className = '' }: LogoProps & { showText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span className="text-lg font-bold text-slate-900" style={{ fontSize: size * 0.65 }}>
        GoGetJob
      </span>
    </span>
  )
}
