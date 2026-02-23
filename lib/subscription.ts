export type SubscriptionProfile = {
    plan?: string | null
    subscription_status?: string | null
    billing_cycle?: string | null
    pro_access_until?: string | null
    pro_cycle_ends_at?: string | null
    pro_generations_used_cycle?: number | null
    pro_cover_letters_used_cycle?: number | null
    free_generations_used_total?: number | null
}

function getIntEnv(name: string, fallback: number): number {
    const raw = process.env[name]
    if (!raw) return fallback
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return fallback
    return parsed
}

export function getResumeFreeLimit(): number {
    return getIntEnv('FREE_RESUME_LIMIT_TOTAL', 3)
}

export function getResumeProMonthlyLimit(): number {
    return getIntEnv('PRO_RESUME_LIMIT_MONTHLY', 30)
}

export function getResumeProYearlyLimit(): number {
    return getIntEnv('PRO_RESUME_LIMIT_YEARLY', 360)
}

export function getCoverLetterProMonthlyLimit(): number {
    return getIntEnv('PRO_COVER_LETTER_LIMIT_MONTHLY', 20)
}

export function getCoverLetterProYearlyLimit(): number {
    return getIntEnv('PRO_COVER_LETTER_LIMIT_YEARLY', 250)
}

/**
 * Returns true if the user currently has an active Pro subscription.
 * Pro is active when plan='pro' AND pro_access_until is in the future.
 */
export function hasProAccess(profile: SubscriptionProfile | null | undefined): boolean {
    if (!profile) return false
    if (profile.plan !== 'pro') return false
    if (!profile.pro_access_until) return false
    return new Date(profile.pro_access_until) > new Date()
}

/**
 * Returns the usage limit for the current plan.
 */
export function getPlanLimit(profile: SubscriptionProfile | null | undefined): number {
    if (!profile) return getResumeFreeLimit()
    if (!hasProAccess(profile)) return getResumeFreeLimit()
    return profile.billing_cycle === 'year' ? getResumeProYearlyLimit() : getResumeProMonthlyLimit()
}

/**
 * Returns the current usage count.
 */
export function getCurrentUsage(profile: SubscriptionProfile | null | undefined): number {
    if (!profile) return 0
    if (hasProAccess(profile)) return profile.pro_generations_used_cycle ?? 0
    return profile.free_generations_used_total ?? 0
}

/**
 * Returns how many generations are remaining.
 */
export function getRemainingGenerations(profile: SubscriptionProfile | null | undefined): number {
    return Math.max(0, getPlanLimit(profile) - getCurrentUsage(profile))
}

/**
 * Returns the cover-letter limit for active Pro users.
 */
export function getCoverLetterPlanLimit(profile: SubscriptionProfile | null | undefined): number {
    if (!profile || !hasProAccess(profile)) return 0
    return profile.billing_cycle === 'year' ? getCoverLetterProYearlyLimit() : getCoverLetterProMonthlyLimit()
}

/**
 * Returns the current cover-letter usage in the active billing cycle.
 */
export function getCoverLetterCurrentUsage(profile: SubscriptionProfile | null | undefined): number {
    if (!profile || !hasProAccess(profile)) return 0
    return profile.pro_cover_letters_used_cycle ?? 0
}

/**
 * Returns remaining cover-letter generations in the active billing cycle.
 */
export function getCoverLetterRemaining(profile: SubscriptionProfile | null | undefined): number {
    return Math.max(0, getCoverLetterPlanLimit(profile) - getCoverLetterCurrentUsage(profile))
}

/**
 * Returns a human-readable plan label.
 */
export function getPlanLabel(profile: SubscriptionProfile | null | undefined): string {
    if (!profile || !hasProAccess(profile)) return 'Free Starter'
    return profile.billing_cycle === 'year' ? 'Pro Yearly' : 'Pro Monthly'
}
