'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserPlan(userId: string, plan: 'free' | 'pro') {
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase.from('profiles').select('is_admin').eq('id', currentUser.id).single()
    if (!adminProfile?.is_admin) return { error: 'Unauthorized' }

    const now = new Date()
    const oneYearFromNow = new Date(now)
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

    const updates: Record<string, unknown> = {
        plan,
        subscription_status: plan === 'pro' ? 'active' : 'inactive',
    }

    if (plan === 'pro') {
        // Admin override: grant 1 year of Pro access with monthly billing cycle
        updates.billing_cycle = 'month'
        updates.pro_access_until = oneYearFromNow.toISOString()
        updates.pro_cycle_started_at = now.toISOString()
        updates.pro_cycle_ends_at = oneYearFromNow.toISOString()
        updates.pro_generations_used_cycle = 0
    } else {
        // Downgrade: revoke Pro access
        updates.billing_cycle = null
        updates.pro_access_until = null
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    revalidatePath('/admin/users')
    revalidatePath('/admin/activity')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase.from('profiles').select('is_admin').eq('id', currentUser.id).single()
    if (!adminProfile?.is_admin) return { error: 'Unauthorized' }

    // Delete from Auth (requires Service Role usually, but RLS might block if not handled. 
    // Supabase Auth deletion usually requires service_role key. 
    // For now we will just delete the profile which cascades? No, auth user deletion is harder from client SDK without service role.)
    // Actually, we can just update status to 'banned' or similar if we had that column.
    // For this prototype, let's just delete the profile row.

    const { error } = await supabase.from('profiles').delete().eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    revalidatePath('/admin/users')
    revalidatePath('/admin/activity')
    return { success: true }
}
