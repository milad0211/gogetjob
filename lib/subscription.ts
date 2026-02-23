export type SubscriptionProfile = {
    plan?: string | null
    subscription_status?: string | null
    billing_cycle?: string | null
    pro_access_until?: string | null
    pro_cycle_ends_at?: string | null
    pro_generations_used_cycle?: number | null
    free_generations_used_total?: number | null
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
    if (!profile) return 3
    if (!hasProAccess(profile)) return 3
    return profile.billing_cycle === 'year' ? 360 : 30
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
 * Returns a human-readable plan label.
 */
export function getPlanLabel(profile: SubscriptionProfile | null | undefined): string {
    if (!profile || !hasProAccess(profile)) return 'Free Starter'
    return profile.billing_cycle === 'year' ? 'Pro Yearly' : 'Pro Monthly'
}
