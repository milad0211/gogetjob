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

    const updates = {
        plan,
        subscription_status: plan === 'pro' ? 'active' : 'inactive'
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
