'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type AdminActionResult = {
    success?: boolean
    error?: string
    message?: string
}

type AdminContext = {
    supabase: Awaited<ReturnType<typeof createClient>>
    currentUserId: string
}

type ProfileForActions = {
    id: string
    is_admin: boolean | null
    plan: 'free' | 'pro' | null
    billing_cycle: 'month' | 'year' | null
    pro_access_until: string | null
}

function isValidUuid(value: string): boolean {
    return UUID_REGEX.test(value)
}

function revalidateAdminViews() {
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    revalidatePath('/admin/activity')
}

async function getAdminContext(): Promise<AdminContext | null> {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return null

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single()

    if (!adminProfile?.is_admin) return null
    return { supabase, currentUserId: currentUser.id }
}

async function getTargetProfile(context: AdminContext, userId: string): Promise<ProfileForActions | null> {
    const { data, error } = await context.supabase
        .from('profiles')
        .select('id, is_admin, plan, billing_cycle, pro_access_until')
        .eq('id', userId)
        .single()

    if (error || !data) return null
    return data as ProfileForActions
}

async function countAdmins(context: AdminContext): Promise<number> {
    const { count } = await context.supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', true)

    return count ?? 0
}

function addDays(base: Date, days: number): Date {
    const next = new Date(base)
    next.setDate(next.getDate() + days)
    return next
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro') {
    if (!isValidUuid(userId)) return { error: 'Invalid user id.' }

    const context = await getAdminContext()
    if (!context) return { error: 'Unauthorized' }

    const target = await getTargetProfile(context, userId)
    if (!target) return { error: 'Target user not found.' }

    const supabase = context.supabase
    const now = new Date()
    const monthFromNow = addDays(now, 30)

    const updates: Record<string, unknown> = {
        plan,
        subscription_status: plan === 'pro' ? 'active' : 'inactive',
    }

    if (plan === 'pro') {
        // Admin override: grant one active Pro month immediately.
        updates.billing_cycle = target.billing_cycle === 'year' ? 'year' : 'month'
        updates.pro_access_until = monthFromNow.toISOString()
        updates.pro_cycle_started_at = now.toISOString()
        updates.pro_cycle_ends_at = monthFromNow.toISOString()
        updates.pro_generations_used_cycle = 0
        updates.pro_cover_letters_used_cycle = 0
    } else {
        // Downgrade: revoke Pro access cleanly.
        updates.billing_cycle = null
        updates.pro_access_until = null
        updates.pro_cycle_started_at = null
        updates.pro_cycle_ends_at = null
        updates.pro_generations_used_cycle = 0
        updates.pro_cover_letters_used_cycle = 0
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) return { error: error.message }

    revalidateAdminViews()
    return { success: true, message: plan === 'pro' ? 'User upgraded to Pro.' : 'User downgraded to Free.' }
}

export async function toggleUserAdmin(userId: string, makeAdmin: boolean): Promise<AdminActionResult> {
    if (!isValidUuid(userId)) return { error: 'Invalid user id.' }

    const context = await getAdminContext()
    if (!context) return { error: 'Unauthorized' }

    if (context.currentUserId === userId && !makeAdmin) {
        return { error: 'You cannot remove your own admin access.' }
    }

    const target = await getTargetProfile(context, userId)
    if (!target) return { error: 'Target user not found.' }

    if (!makeAdmin && target.is_admin) {
        const adminCount = await countAdmins(context)
        if (adminCount <= 1) {
            return { error: 'Cannot remove the last admin account.' }
        }
    }

    const { error } = await context.supabase
        .from('profiles')
        .update({ is_admin: makeAdmin })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidateAdminViews()
    return {
        success: true,
        message: makeAdmin ? 'Admin access granted.' : 'Admin access removed.',
    }
}

export async function resetUserUsage(userId: string): Promise<AdminActionResult> {
    if (!isValidUuid(userId)) return { error: 'Invalid user id.' }

    const context = await getAdminContext()
    if (!context) return { error: 'Unauthorized' }

    const { error } = await context.supabase
        .from('profiles')
        .update({
            free_generations_used_total: 0,
            pro_generations_used_cycle: 0,
            pro_cover_letters_used_cycle: 0,
        })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidateAdminViews()
    return { success: true, message: 'Usage counters reset.' }
}

export async function extendProAccess(userId: string, days: number = 30): Promise<AdminActionResult> {
    if (!isValidUuid(userId)) return { error: 'Invalid user id.' }
    if (!Number.isFinite(days) || days < 1 || days > 365) {
        return { error: 'Extension days must be between 1 and 365.' }
    }

    const context = await getAdminContext()
    if (!context) return { error: 'Unauthorized' }

    const target = await getTargetProfile(context, userId)
    if (!target) return { error: 'Target user not found.' }

    const now = new Date()
    const currentEnd = target.pro_access_until ? new Date(target.pro_access_until) : null
    const baseline = currentEnd && currentEnd > now ? currentEnd : now
    const nextEnd = addDays(baseline, Math.floor(days))

    const updates: Record<string, unknown> = {
        plan: 'pro',
        subscription_status: 'active',
        billing_cycle: target.billing_cycle === 'year' ? 'year' : 'month',
        pro_access_until: nextEnd.toISOString(),
        pro_cycle_ends_at: nextEnd.toISOString(),
    }

    if (!currentEnd || currentEnd <= now) {
        updates.pro_cycle_started_at = now.toISOString()
        updates.pro_generations_used_cycle = 0
        updates.pro_cover_letters_used_cycle = 0
    }

    const { error } = await context.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidateAdminViews()
    return { success: true, message: `Pro access extended by ${Math.floor(days)} days.` }
}

export async function clearUserGenerations(userId: string): Promise<AdminActionResult> {
    if (!isValidUuid(userId)) return { error: 'Invalid user id.' }

    const context = await getAdminContext()
    if (!context) return { error: 'Unauthorized' }

    const { error } = await context.supabase
        .from('resume_generations')
        .delete()
        .eq('user_id', userId)

    if (error) return { error: error.message }

    // Keep the profile aggregate coherent after cleanup.
    const { error: profileError } = await context.supabase
        .from('profiles')
        .update({
            total_generations_used: 0,
            free_generations_used_total: 0,
            pro_generations_used_cycle: 0,
            pro_cover_letters_used_cycle: 0,
        })
        .eq('id', userId)

    if (profileError) return { error: profileError.message }

    revalidateAdminViews()
    return { success: true, message: 'User generation history cleared.' }
}

export async function deleteUser(userId: string) {
    if (!isValidUuid(userId)) return { error: 'Invalid user id.' }

    const context = await getAdminContext()
    if (!context) return { error: 'Unauthorized' }

    if (context.currentUserId === userId) {
        return { error: 'You cannot delete your own account from admin panel.' }
    }

    const target = await getTargetProfile(context, userId)
    if (!target) return { error: 'Target user not found.' }

    if (target.is_admin) {
        const adminCount = await countAdmins(context)
        if (adminCount <= 1) {
            return { error: 'Cannot delete the last admin account.' }
        }
    }

    const { error } = await context.supabase.from('profiles').delete().eq('id', userId)
    if (error) return { error: error.message }

    revalidateAdminViews()
    return { success: true, message: 'Profile deleted. Auth account may still exist until full identity cleanup.' }
}
