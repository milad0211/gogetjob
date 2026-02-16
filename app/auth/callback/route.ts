import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Ensure profile exists (in case it was manually deleted but auth user remains)
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.rpc('ensure_user_profile', {
                    user_id: user.id,
                    user_email: user.email,
                    user_full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                    user_avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
                })
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth`)
}
