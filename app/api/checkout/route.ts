import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPolarApiBaseUrl, getReturnBaseUrl } from '@/lib/polar/config'

const MONTHLY_PRODUCT_ID = process.env.POLAR_MONTHLY_PRODUCT_ID
const YEARLY_PRODUCT_ID = process.env.POLAR_YEARLY_PRODUCT_ID

export async function GET(req: NextRequest) {
    const plan = req.nextUrl.searchParams.get('plan')

    if (plan !== 'monthly' && plan !== 'yearly') {
        return NextResponse.json({ error: 'Invalid plan. Use ?plan=monthly or ?plan=yearly' }, { status: 400 })
    }

    const productId = plan === 'monthly' ? MONTHLY_PRODUCT_ID : YEARLY_PRODUCT_ID

    if (!productId) {
        console.error(`[Checkout] Missing POLAR_${plan.toUpperCase()}_PRODUCT_ID env variable`)
        return NextResponse.json({ error: 'Product not configured' }, { status: 500 })
    }

    const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim()
    if (!accessToken) {
        return NextResponse.json({ error: 'POLAR_ACCESS_TOKEN is missing' }, { status: 500 })
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Get user profile for email
    const { data: profile } = await supabase
        .from('profiles')
        .select('email, polar_customer_id')
        .eq('id', user.id)
        .single()

    const returnBaseUrl = getReturnBaseUrl(req.url)
    if (!returnBaseUrl) {
        return NextResponse.json({ error: 'Missing app URL configuration' }, { status: 500 })
    }

    const polarApiBase = getPolarApiBaseUrl()

    // Build the Checkout Session request
    // Polar API expects "products" as an array of product IDs
    const checkoutBody: Record<string, unknown> = {
        products: [productId],
        success_url: `${returnBaseUrl}/success?checkout_id={CHECKOUT_ID}`,
        metadata: {
            user_id: user.id,
        },
        customer_email: profile?.email || user.email,
    }

    console.log(`[Checkout] Creating session: plan=${plan}, product=${productId}, user=${user.id}, api=${polarApiBase}`)

    const resp = await fetch(`${polarApiBase}/v1/checkouts/`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutBody),
    })

    if (!resp.ok) {
        const text = await resp.text()
        console.error(`[Checkout] Polar API error (${resp.status}):`, text)
        return NextResponse.json(
            { error: 'Failed to create checkout session', detail: text },
            { status: resp.status }
        )
    }

    const checkoutData = await resp.json()

    // Redirect user to the Polar checkout page
    if (checkoutData.url) {
        return NextResponse.redirect(checkoutData.url)
    }

    console.error('[Checkout] No URL in Polar checkout response:', checkoutData)
    return NextResponse.json({ error: 'Checkout URL not returned' }, { status: 500 })
}

