type RateLimitResult = {
    success: boolean
    limit: number
    remaining: number
    reset: number
}

type RateLimiter = {
    limit: (key: string) => Promise<RateLimitResult>
}

const WINDOW_MS = 60_000
const LIMIT = 5
const buckets = new Map<string, { count: number; resetAt: number }>()

export const ratelimit: RateLimiter = {
    async limit(key: string) {
        const now = Date.now()
        const existing = buckets.get(key)

        if (!existing || existing.resetAt <= now) {
            const resetAt = now + WINDOW_MS
            buckets.set(key, { count: 1, resetAt })
            return { success: true, limit: LIMIT, remaining: LIMIT - 1, reset: resetAt }
        }

        existing.count += 1
        const remaining = Math.max(0, LIMIT - existing.count)
        return {
            success: existing.count <= LIMIT,
            limit: LIMIT,
            remaining,
            reset: existing.resetAt,
        }
    },
}
