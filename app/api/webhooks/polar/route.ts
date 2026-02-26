import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { createAdminClient } from '@/lib/supabase/admin'

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET
const MONTHLY_PRODUCT_ID = process.env.POLAR_MONTHLY_PRODUCT_ID
const YEARLY_PRODUCT_ID = process.env.POLAR_YEARLY_PRODUCT_ID

function extractProductId(data: Record<string, unknown>): string | null {
    if (data.product_id) return data.product_id as string

    if (data.product && typeof data.product === 'object') {
        const product = data.product as Record<string, unknown>
        if (product.id) return product.id as string
    }

    if (Array.isArray(data.items) && data.items.length > 0) {
        const item = data.items[0] as Record<string, unknown>
        if (item.product_id) return item.product_id as string
        if (item.product && typeof item.product === 'object') {
            const product = item.product as Record<string, unknown>
            if (product.id) return product.id as string
        }
    }

    return null
}

function mapProductToBillingCycle(productId: string | null): 'month' | 'year' | null {
    if (!productId) return null
    if (productId === MONTHLY_PRODUCT_ID) return 'month'
    if (productId === YEARLY_PRODUCT_ID) return 'year'
    console.warn(`[Webhook] Unknown product_id: ${productId}. POLAR_MONTHLY_PRODUCT_ID=${MONTHLY_PRODUCT_ID}, POLAR_YEARLY_PRODUCT_ID=${YEARLY_PRODUCT_ID}`)
    return null
}

/**
 * Resolve the Supabase user ID from webhook data.
 * Priority:
 *   1. metadata.user_id (set via Checkout Sessions API)
 *   2. polar_customer_id lookup in profiles table (returning subscribers)
 *   3. customer email lookup in profiles table (first-time subscribers)
 */
async function resolveUserId(
    data: Record<string, unknown>,
    supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
    // 1. Try metadata.user_id (from Checkout Sessions API)
    const metadata = data.metadata as Record<string, unknown> | undefined
    if (metadata?.user_id) {
        console.log(`[Webhook] User resolved via metadata.user_id: ${metadata.user_id}`)
        return metadata.user_id as string
    }

    // 2. Try polar_customer_id lookup (for returning subscribers)
    const customerId = data.customer_id as string | undefined
    if (customerId) {
        const { data: profileByCustomer } = await supabase
            .from('profiles')
            .select('id')
            .eq('polar_customer_id', customerId)
            .maybeSingle()

        if (profileByCustomer) {
            console.log(`[Webhook] User resolved via polar_customer_id: ${profileByCustomer.id}`)
            return profileByCustomer.id
        }
    }

    // 3. Try customer email lookup (for first-time subscribers)
    const customer = data.customer as Record<string, unknown> | undefined
    const email = customer?.email as string | undefined
    if (email) {
        const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (profileByEmail) {
            console.log(`[Webhook] User resolved via customer email (${email}): ${profileByEmail.id}`)
            return profileByEmail.id
        }
    }

    console.warn('[Webhook] Could not resolve user_id from metadata, customer_id, or email', {
        hasMetadata: Boolean(metadata?.user_id),
        customerId,
        email,
    })
    return null
}

export async function POST(req: NextRequest) {
    if (!WEBHOOK_SECRET) {
        console.error('[Webhook] POLAR_WEBHOOK_SECRET is missing')
        return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // 1. Validate Signature
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const wh = new Webhook(WEBHOOK_SECRET)

    try {
        wh.verify(payload, headers as Record<string, string>)
    } catch (err) {
        console.error('[Webhook] Signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(payload)
    const { type, data } = event
    const eventId: string = event.id || `${type}_${Date.now()}`

    console.log(`[Webhook] Received: ${type} (event: ${eventId})`)

    let supabase
    try {
        supabase = createAdminClient()
    } catch (error) {
        console.error('[Webhook] Failed to create Supabase admin client:', error)
        return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // 2. Idempotency check
    const { data: existing, error: idempotencyError } = await supabase
        .from('polar_webhook_events')
        .select('id')
        .eq('id', eventId)
        .maybeSingle()

    if (idempotencyError) {
        console.error('[Webhook] Idempotency check failed:', idempotencyError.message)
        // Continue processing — don't block on idempotency table errors
    }

    if (existing) {
        console.log(`[Webhook] Duplicate event ${eventId}, ignoring.`)
        return NextResponse.json({ received: true, duplicate: true })
    }

    // Record the event
    const { error: insertError } = await supabase.from('polar_webhook_events').insert({
        id: eventId,
        type,
        subscription_id: data?.id || null,
    })

    if (insertError) {
        console.error('[Webhook] Failed to record event:', insertError.message)
        // Continue processing — the event insert failing shouldn't block the update
    }

    // 3. Handle subscription.created / subscription.updated
    if (type === 'subscription.created' || type === 'subscription.updated' || type === 'subscription.active') {
        const userId = await resolveUserId(data, supabase)
        const status: string = data.status // 'active', 'canceled', etc.

        if (!userId) {
            console.error('[Webhook] CRITICAL: No user found for subscription event', {
                type,
                customerId: data.customer_id,
                customerEmail: (data.customer as Record<string, unknown>)?.email,
                metadata: data.metadata,
            })
            return NextResponse.json({ received: true, error: 'user_not_found' })
        }

        const productId = extractProductId(data)
        const billingCycle = mapProductToBillingCycle(productId)
        const isPro = status === 'active' || status === 'trialing'
        const isPastDue = status === 'past_due'

        // Extract period dates from Polar
        const currentPeriodStart = data.current_period_start || null
        const currentPeriodEnd = data.current_period_end || null

        if (isPro) {
            const updates: Record<string, unknown> = {
                plan: 'pro',
                subscription_status: status,
                polar_customer_id: data.customer_id || null,
                polar_subscription_id: data.id || null,
                polar_product_id: productId,
            }

            if (billingCycle) {
                updates.billing_cycle = billingCycle
            }

            if (currentPeriodStart) {
                updates.pro_cycle_started_at = currentPeriodStart
            }
            if (currentPeriodEnd) {
                updates.pro_cycle_ends_at = currentPeriodEnd
                updates.pro_access_until = currentPeriodEnd
            }

            // If this is a new period (or plan change), reset the cycle counter
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('pro_cycle_started_at, polar_product_id')
                .eq('id', userId)
                .single()

            const periodChanged = existingProfile?.pro_cycle_started_at !== currentPeriodStart && currentPeriodStart
            const planChanged = existingProfile?.polar_product_id !== productId && productId
            if (periodChanged || planChanged) {
                updates.pro_generations_used_cycle = 0
                updates.pro_cover_letters_used_cycle = 0
            }

            const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userId)

            if (updateError) {
                console.error(`[Webhook] FAILED to update profile for user ${userId}:`, updateError.message)
                return NextResponse.json({ received: true, error: 'update_failed' }, { status: 500 })
            }

            console.log(`[Webhook] SUCCESS: User ${userId}: plan=pro, cycle=${billingCycle}, period=${currentPeriodStart}→${currentPeriodEnd}`)

        } else if (isPastDue) {
            const { error: updateError } = await supabase.from('profiles').update({
                subscription_status: 'past_due',
            }).eq('id', userId)

            if (updateError) {
                console.error(`[Webhook] FAILED to update past_due for user ${userId}:`, updateError.message)
            }

            console.log(`[Webhook] User ${userId}: past_due — grace period, access kept until pro_access_until`)

        } else {
            const { error: updateError } = await supabase.from('profiles').update({
                subscription_status: status,
            }).eq('id', userId)

            if (updateError) {
                console.error(`[Webhook] FAILED to update status for user ${userId}:`, updateError.message)
            }

            console.log(`[Webhook] User ${userId}: subscription status → ${status} (access kept until pro_access_until)`)
        }
    }

    // 4. Handle subscription.canceled
    if (type === 'subscription.canceled') {
        const userId = await resolveUserId(data, supabase)
        if (userId) {
            const currentPeriodEnd = data.current_period_end || null
            const { error: updateError } = await supabase.from('profiles').update({
                subscription_status: 'canceled',
                ...(currentPeriodEnd ? { pro_access_until: currentPeriodEnd } : {}),
            }).eq('id', userId)

            if (updateError) {
                console.error(`[Webhook] FAILED to update canceled for user ${userId}:`, updateError.message)
            }

            console.log(`[Webhook] User ${userId}: canceled. Access until ${currentPeriodEnd}`)
        }
    }

    // 5. Handle refund — revoke Pro immediately
    if (type === 'refund.created' || type === 'order.refunded' || type === 'subscription.revoked') {
        const refundMetadata = data.metadata as Record<string, unknown> | undefined
        const subMetadata = (data.subscription as Record<string, unknown> | undefined)?.metadata as Record<string, unknown> | undefined
        let userId = (refundMetadata?.user_id || subMetadata?.user_id) as string | undefined

        // Fallback: resolve via customer data
        if (!userId) {
            userId = await resolveUserId(data, supabase) || undefined
        }

        if (userId) {
            const { error: updateError } = await supabase.from('profiles').update({
                plan: 'free',
                subscription_status: 'inactive',
                pro_access_until: new Date().toISOString(),
                billing_cycle: null,
                pro_cover_letters_used_cycle: 0,
            }).eq('id', userId)

            if (updateError) {
                console.error(`[Webhook] FAILED to revoke pro for user ${userId}:`, updateError.message)
            }

            console.log(`[Webhook] User ${userId}: REFUNDED/REVOKED — Pro access revoked immediately`)
        }
    }

    return NextResponse.json({ received: true })
}
