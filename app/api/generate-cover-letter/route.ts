import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
    hasProAccess,
    getCoverLetterProMonthlyLimit,
    getCoverLetterProYearlyLimit,
} from '@/lib/subscription'
import { generateCoverLetter } from '@/lib/resume-engine/ai'
import { parseJobDescription } from '@/lib/resume-engine/job-parser'
import type { CanonicalResume } from '@/lib/resume-engine/types'
import type { JobSpec } from '@/lib/resume-engine/types'

type CoverLetterQuota = {
    allowed: boolean
    reason: string
    remaining: number
    limit: number
    resets_at?: string
}

function isQuotaExceededError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const err = error as { message?: string; status?: number; statusText?: string }
    const message = (err.message || '').toLowerCase()
    const statusText = (err.statusText || '').toLowerCase()
    return err.status === 429 || message.includes('quota') || message.includes('too many requests') || statusText.includes('too many requests')
}

function fallbackCoverLetter(resume: CanonicalResume, jobSpec: JobSpec): string {
    const name = resume.contact?.name || 'Candidate'
    const role = jobSpec.title || 'this role'
    const company = jobSpec.companyName || 'your team'
    const proof1 = resume.experience[0]?.bullets?.[0] || resume.summary || 'I have delivered measurable results across software projects.'
    const proof2 = resume.experience[0]?.bullets?.[1] || resume.experience[1]?.bullets?.[0] || 'I consistently collaborate across teams to deliver high-quality outcomes.'
    const keySkills = resume.skills.slice(0, 5).join(', ')

    return `Dear Hiring Manager,

I am excited to apply for the ${role} position at ${company}, where I can contribute with hands-on experience in ${keySkills || 'software engineering'}.

In my recent work, ${proof1.charAt(0).toLowerCase() + proof1.slice(1)}. I also demonstrated strong execution by ${proof2.charAt(0).toLowerCase() + proof2.slice(1)}.

What draws me to this opportunity is the chance to apply my background to a role with clear product and technical impact. I am confident I can add value quickly while maintaining quality, ownership, and collaboration standards.

Thank you for your time and consideration. I would welcome the opportunity to discuss how my experience aligns with your needs.

Sincerely,
${name}`.trim()
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('plan, subscription_status, pro_access_until, billing_cycle, pro_cycle_started_at, pro_cycle_ends_at')
        .eq('id', user.id)
        .single()

    const isPro = hasProAccess(profile)
    if (!isPro) {
        return NextResponse.json(
            { error: 'Cover Letter generation is a Pro feature. Please upgrade.' },
            { status: 403 }
        )
    }

    const monthlyLimit = getCoverLetterProMonthlyLimit()
    const yearlyLimit = getCoverLetterProYearlyLimit()

    let reserved = false
    try {
        const { data: quotaResult, error: quotaError } = await supabase.rpc('reserve_cover_letter', {
            p_user_id: user.id,
            p_pro_monthly_limit: monthlyLimit,
            p_pro_yearly_limit: yearlyLimit,
        })

        let quota: CoverLetterQuota
        if (quotaError) {
            // Backward compatibility when SQL migration is not applied yet.
            if (quotaError.message?.includes('function public.reserve_cover_letter')) {
                let usageQuery = supabase
                    .from('resume_generations')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .not('cover_letter_text', 'is', null)

                if (profile?.pro_cycle_started_at) {
                    usageQuery = usageQuery.gte('created_at', profile.pro_cycle_started_at)
                }

                const { count, error: countError } = await usageQuery
                if (countError) {
                    console.error('[CoverLetter] Fallback quota count error:', countError)
                    return NextResponse.json(
                        { error: 'Could not verify cover letter quota.', code: 'quota_error' },
                        { status: 500 }
                    )
                }

                const used = count ?? 0
                const limit = profile?.billing_cycle === 'year' ? yearlyLimit : monthlyLimit
                quota = {
                    allowed: used < limit,
                    reason: used < limit ? 'pro' : 'cover_letter_limit_reached',
                    remaining: Math.max(0, limit - used - 1),
                    limit,
                    resets_at: profile?.pro_cycle_ends_at || undefined,
                }
            } else {
                console.error('[CoverLetter] reserve_cover_letter RPC error:', quotaError)
                return NextResponse.json(
                    { error: 'Could not verify cover letter quota.', code: 'quota_error' },
                    { status: 500 }
                )
            }
        } else {
            quota = quotaResult as CoverLetterQuota
        }

        if (!quota.allowed) {
            const message = `You have reached your ${quota.limit} cover letter limit for this billing cycle.${quota.resets_at ? ` Resets on ${new Date(quota.resets_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` : ''}`
            return NextResponse.json(
                {
                    error: message,
                    code: 'cover_letter_limit_reached',
                    remaining: 0,
                    limit: quota.limit,
                    resets_at: quota.resets_at || null,
                },
                { status: 402 }
            )
        }

        reserved = !quotaError
        const { resumeId } = await request.json()

        const { data: generation } = await supabase
            .from('resume_generations')
            .select('resume_generated_text, job_text')
            .eq('id', resumeId)
            .eq('user_id', user.id)
            .single()

        if (!generation) {
            throw new Error('Resume generation not found')
        }

        let optimizedResume: CanonicalResume
        try {
            optimizedResume = JSON.parse(generation.resume_generated_text) as CanonicalResume
        } catch {
            throw new Error('Could not parse saved resume data')
        }

        const jobSpec = await parseJobDescription(generation.job_text, { preferHeuristic: true })

        let coverLetter: string
        try {
            coverLetter = await generateCoverLetter(optimizedResume, jobSpec, generation.job_text)
        } catch (error) {
            if (!isQuotaExceededError(error)) throw error
            coverLetter = fallbackCoverLetter(optimizedResume, jobSpec)
        }

        const { data: savedRow, error: saveError } = await supabase
            .from('resume_generations')
            .update({ cover_letter_text: coverLetter })
            .eq('id', resumeId)
            .eq('user_id', user.id)
            .select('id')
            .maybeSingle()

        if (saveError) {
            throw new Error(saveError.message || 'Failed to persist generated cover letter')
        }

        if (!savedRow) {
            throw new Error('Generated cover letter could not be saved. Missing UPDATE policy on resume_generations.')
        }

        return NextResponse.json({
            coverLetter,
            remaining: quota.remaining,
            limit: quota.limit,
            resets_at: quota.resets_at || null,
        })
    } catch (error) {
        console.error('[CoverLetter] Error:', error)

        if (reserved) {
            try {
                await supabase.rpc('release_cover_letter', { p_user_id: user.id })
            } catch (releaseError) {
                console.error('[CoverLetter] Failed to release reserved quota:', releaseError)
            }
        }

        if (isQuotaExceededError(error)) {
            return NextResponse.json(
                { error: 'AI quota exceeded. Please try again later.', code: 'ai_quota_exceeded' },
                { status: 429 }
            )
        }

        const message = error instanceof Error ? error.message : 'Failed to generate cover letter'
        const status = message === 'Resume generation not found'
            ? 404
            : message.includes('Missing UPDATE policy')
                ? 403
                : 500
        return NextResponse.json({ error: message }, { status })
    }
}
