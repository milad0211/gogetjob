import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Webhook } from 'standardwebhooks'

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET

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
        wh.verify(payload, headers as any)
    } catch (err) {
        console.error('Webhook verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(payload)
    const { type, data } = event

    console.log('Received Polar Webhook:', type)

    // 2. Handle Events
    // subscription.created, subscription.updated, order.created (if one-time)
    if (type === 'subscription.created' || type === 'subscription.updated') {
        const userId = data.metadata?.user_id
        const status = data.status // 'active', 'canceled', etc.
        // Polar status: 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'

        if (userId) {
            const supabase = await createClient()

            const isPro = status === 'active' || status === 'trialing'

            await supabase
                .from('profiles')
                .update({
                    plan: isPro ? 'pro' : 'free',
                    subscription_status: status
                })
                .eq('id', userId)

            console.log(`Updated user ${userId} plan to ${isPro ? 'pro' : 'free'} (${status})`)
        }
    }

    // Handle checkout.created if needed for logic, but subscription.created is better for subscriptions.

    return NextResponse.json({ received: true })
}
