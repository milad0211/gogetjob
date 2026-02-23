import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Webhook } from 'standardwebhooks'

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET
const MONTHLY_PRODUCT_ID = process.env.POLAR_MONTHLY_PRODUCT_ID
const YEARLY_PRODUCT_ID = process.env.POLAR_YEARLY_PRODUCT_ID

function extractProductId(data: Record<string, unknown>): string | null {
    // Polar uses 'product_id' now instead of 'price_id'
    // Let's check a few possible locations in the `subscription.created` payload:
    if (data.product_id) return data.product_id as string
    
    // Sometimes it's nested in a 'product' object
    if (data.product && typeof data.product === 'object') {
        const product = data.product as Record<string, unknown>
        if (product.id) return product.id as string
    }

    // Checking in items array
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
    // Fallback: if the IDs aren't set yet, we can't determine
    console.warn(`[Webhook] Unknown product_id: ${productId}. POLAR_MONTHLY_PRODUCT_ID=${MONTHLY_PRODUCT_ID}, POLAR_YEARLY_PRODUCT_ID=${YEARLY_PRODUCT_ID}`)
    return null
}

export async function POST(req: NextRequest) {
    if (!WEBHOOK_SECRET) {
        console.error('POLAR_WEBHOOK_SECRET is missing')
        return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // 1. Validate Signature
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const wh = new Webhook(WEBHOOK_SECRET)

    try {
        wh.verify(payload, headers as Record<string, string>)
    } catch (err) {
        console.error('Webhook verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(payload)
    const { type, data } = event
    const eventId: string = event.id || `${type}_${Date.now()}`

    console.log(`[Webhook] Received: ${type} (event: ${eventId})`)

    const supabase = await createClient()

    // 2. Idempotency check
    const { data: existing } = await supabase
        .from('polar_webhook_events')
        .select('id')
        .eq('id', eventId)
        .maybeSingle()

    if (existing) {
        console.log(`[Webhook] Duplicate event ${eventId}, ignoring.`)
        return NextResponse.json({ received: true, duplicate: true })
    }

    // Record the event
    await supabase.from('polar_webhook_events').insert({
        id: eventId,
        type,
        subscription_id: data?.id || null,
    })

    // 3. Handle subscription.created / subscription.updated
    if (type === 'subscription.created' || type === 'subscription.updated') {
        const userId = data.metadata?.user_id
        const status: string = data.status // 'active', 'canceled', etc.

        if (!userId) {
            console.warn('[Webhook] No user_id in metadata')
            return NextResponse.json({ received: true })
        }

        const productId = extractProductId(data)
        const billingCycle = mapProductToBillingCycle(productId)
        const isPro = status === 'active' || status === 'trialing'
        const isPastDue = status === 'past_due'

        // Extract period dates from Polar
        const currentPeriodStart = data.current_period_start || null
        const currentPeriodEnd = data.current_period_end || null

        if (isPro) {
            // ── ACTIVE / TRIALING ─────────────────────────────────
            // This also handles UPGRADES (monthly→yearly or vice versa):
            // We overwrite billing_cycle, product_id, and reset the counter.
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

            await supabase.from('profiles').update(updates).eq('id', userId)
            console.log(`[Webhook] User ${userId}: plan=pro, cycle=${billingCycle}, period=${currentPeriodStart}→${currentPeriodEnd}`)

        } else if (isPastDue) {
            // ── PAST_DUE ───────────────────────────────────────────
            // Payment failed, but we give a grace period.
            // Keep pro_access_until intact (user keeps access until it expires).
            // Just flag the status so the UI can show a "payment issue" warning.
            await supabase.from('profiles').update({
                subscription_status: 'past_due',
            }).eq('id', userId)

            console.log(`[Webhook] User ${userId}: past_due — grace period, access kept until pro_access_until`)

        } else {
            // ── CANCELED / OTHER ────────────────────────────────────
            // For cancel: don't revoke Pro immediately. User keeps access until pro_access_until.
            // Just update status to reflect the cancellation.
            await supabase.from('profiles').update({
                subscription_status: status,
            }).eq('id', userId)

            console.log(`[Webhook] User ${userId}: subscription status → ${status} (access kept until pro_access_until)`)
        }
    }

    // 4. Handle subscription.canceled — user cancelled, keeps access until period end
    if (type === 'subscription.canceled') {
        const userId = data.metadata?.user_id
        if (userId) {
            const currentPeriodEnd = data.current_period_end || null
            await supabase.from('profiles').update({
                subscription_status: 'canceled',
                // Ensure pro_access_until stays at current_period_end
                ...(currentPeriodEnd ? { pro_access_until: currentPeriodEnd } : {}),
            }).eq('id', userId)

            console.log(`[Webhook] User ${userId}: canceled. Access until ${currentPeriodEnd}`)
        }
    }

    // 5. Handle refund — revoke Pro immediately
    if (type === 'refund.created' || type === 'order.refunded' || type === 'subscription.revoked') {
        const userId = data.metadata?.user_id || data.subscription?.metadata?.user_id
        if (userId) {
            await supabase.from('profiles').update({
                plan: 'free',
                subscription_status: 'inactive',
                pro_access_until: new Date().toISOString(),
                billing_cycle: null,
                pro_cover_letters_used_cycle: 0,
            }).eq('id', userId)

            console.log(`[Webhook] User ${userId}: REFUNDED/REVOKED — Pro access revoked immediately`)
        }
    }

    return NextResponse.json({ received: true })
}
