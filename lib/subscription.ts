export type SubscriptionProfile = {
    plan?: string | null
    subscription_status?: string | null
}

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

export function hasProAccess(profile: SubscriptionProfile | null | undefined): boolean {
    if (!profile) return false

    const plan = profile.plan?.toLowerCase()
    const status = profile.subscription_status?.toLowerCase()

    return plan === 'pro' || (status ? ACTIVE_STATUSES.has(status) : false)
}
