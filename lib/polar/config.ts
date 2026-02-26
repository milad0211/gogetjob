export type PlanKey = 'monthly' | 'yearly'

type CheckoutEnvKey = {
    envKey: string
    label: string
}

export type ResolvedCheckoutConfig = {
    plan: PlanKey
    sourceKey: string | null
    sourceLabel: string
    normalizedUrl: string | null
    checkoutLinkId: string | null
    isSandbox: boolean
    error: 'missing_env' | 'invalid_env' | null
}

const CHECKOUT_ENV_PRIORITY: Record<PlanKey, CheckoutEnvKey[]> = {
    monthly: [
        { envKey: 'NEXT_PUBLIC_POLAR_CHECKOUT_URL_MONTHLY', label: 'NEXT_PUBLIC_POLAR_CHECKOUT_URL_MONTHLY' },
        { envKey: 'POLAR_CHECKOUT_URL_MONTHLY', label: 'POLAR_CHECKOUT_URL_MONTHLY' },
    ],
    yearly: [
        { envKey: 'NEXT_PUBLIC_POLAR_CHECKOUT_URL_YEARLY', label: 'NEXT_PUBLIC_POLAR_CHECKOUT_URL_YEARLY' },
        { envKey: 'POLAR_CHECKOUT_URL_YEARLY', label: 'POLAR_CHECKOUT_URL_YEARLY' },
    ],
}

function normalizeEnvUrl(rawValue: string | undefined): string | null {
    if (!rawValue) return null

    let normalized = rawValue.trim()
    if (!normalized) return null

    // Handle mistakenly pasted "KEY=value" strings.
    if (normalized.includes('=') && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = normalized.split('=').slice(1).join('=').trim()
    }

    normalized = normalized.replace(/^['"]/, '').replace(/['"]$/, '').trim()
    if (!normalized) return null

    return normalized
}

function extractCheckoutLinkId(url: URL): string | null {
    const host = url.hostname.toLowerCase()
    const segments = url.pathname.split('/').filter(Boolean)

    if (host === 'buy.polar.sh' || host.endsWith('.buy.polar.sh')) {
        const slug = segments[segments.length - 1]
        return slug?.startsWith('polar_cl_') ? slug : null
    }

    // Examples:
    // /v1/checkout-links/polar_cl_xxx/redirect
    // /checkout-links/polar_cl_xxx/redirect
    const checkoutLinksIndex = segments.findIndex((segment) => segment === 'checkout-links')
    if (checkoutLinksIndex >= 0) {
        const candidate = segments[checkoutLinksIndex + 1]
        return candidate?.startsWith('polar_cl_') ? candidate : null
    }

    return null
}

function resolveCheckoutConfig(plan: PlanKey): ResolvedCheckoutConfig {
    const candidates = CHECKOUT_ENV_PRIORITY[plan]

    for (const candidate of candidates) {
        const normalized = normalizeEnvUrl(process.env[candidate.envKey])
        if (!normalized) continue

        try {
            const parsed = new URL(normalized)
            if (!parsed.protocol.startsWith('http')) {
                return {
                    plan,
                    sourceKey: candidate.envKey,
                    sourceLabel: candidate.label,
                    normalizedUrl: null,
                    checkoutLinkId: null,
                    isSandbox: false,
                    error: 'invalid_env',
                }
            }

            return {
                plan,
                sourceKey: candidate.envKey,
                sourceLabel: candidate.label,
                normalizedUrl: parsed.toString(),
                checkoutLinkId: extractCheckoutLinkId(parsed),
                isSandbox: parsed.hostname.includes('sandbox'),
                error: null,
            }
        } catch {
            return {
                plan,
                sourceKey: candidate.envKey,
                sourceLabel: candidate.label,
                normalizedUrl: null,
                checkoutLinkId: null,
                isSandbox: false,
                error: 'invalid_env',
            }
        }
    }

    return {
        plan,
        sourceKey: null,
        sourceLabel: candidates.map((item) => item.label).join(' / '),
        normalizedUrl: null,
        checkoutLinkId: null,
        isSandbox: false,
        error: 'missing_env',
    }
}

export function resolvePolarCheckoutConfigs(): {
    monthly: ResolvedCheckoutConfig
    yearly: ResolvedCheckoutConfig
    duplicateTargets: boolean
    anySandbox: boolean
} {
    const monthly = resolveCheckoutConfig('monthly')
    const yearly = resolveCheckoutConfig('yearly')

    const duplicateById = Boolean(
        monthly.checkoutLinkId &&
        yearly.checkoutLinkId &&
        monthly.checkoutLinkId === yearly.checkoutLinkId
    )

    const duplicateByUrl = Boolean(
        monthly.normalizedUrl &&
        yearly.normalizedUrl &&
        monthly.normalizedUrl === yearly.normalizedUrl
    )

    return {
        monthly,
        yearly,
        duplicateTargets: duplicateById || duplicateByUrl,
        anySandbox: monthly.isSandbox || yearly.isSandbox,
    }
}

export function attachCheckoutMetadata(checkoutUrl: string | null, userId: string | undefined): string | null {
    if (!checkoutUrl || !userId) return null

    try {
        const url = new URL(checkoutUrl)
        url.searchParams.set('metadata[user_id]', userId)
        return url.toString()
    } catch {
        return null
    }
}

export function getPolarApiBaseUrl(): string {
    const raw = normalizeEnvUrl(process.env.POLAR_API_BASE_URL)
    if (raw) {
        try {
            const parsed = new URL(raw)
            return parsed.origin
        } catch {
            return 'https://sandbox-api.polar.sh'
        }
    }

    const inferredCheckoutUrl = normalizeEnvUrl(process.env.POLAR_CHECKOUT_URL_MONTHLY)
        || normalizeEnvUrl(process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_MONTHLY)
        || normalizeEnvUrl(process.env.POLAR_CHECKOUT_URL_YEARLY)
        || normalizeEnvUrl(process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_YEARLY)

    if (inferredCheckoutUrl) {
        try {
            const parsedCheckout = new URL(inferredCheckoutUrl)
            if (parsedCheckout.hostname.includes('sandbox')) {
                return 'https://sandbox-api.polar.sh'
            }
        } catch {
            return 'https://sandbox-api.polar.sh'
        }
    }

    return 'https://api.polar.sh'
}

export function getReturnBaseUrl(reqUrl?: string): string | null {
    const envCandidates = [
        normalizeEnvUrl(process.env.NEXT_PUBLIC_APP_URL),
        normalizeEnvUrl(process.env.NEXT_PUBLIC_SITE_URL),
    ].filter((value): value is string => Boolean(value))

    for (const candidate of envCandidates) {
        try {
            return new URL(candidate).origin
        } catch {
            // ignore invalid and continue to next fallback
        }
    }

    if (reqUrl) {
        try {
            return new URL(reqUrl).origin
        } catch {
            return null
        }
    }

    return null
}
