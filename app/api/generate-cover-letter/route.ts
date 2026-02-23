import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasProAccess } from '@/lib/subscription'
import { generateCoverLetter } from '@/lib/resume-engine/ai'
import { parseJobDescription } from '@/lib/resume-engine/job-parser'
import type { CanonicalResume } from '@/lib/resume-engine/types'
import type { JobSpec } from '@/lib/resume-engine/types'

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

    // Check Pro Status
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan, subscription_status, pro_access_until')
        .eq('id', user.id)
        .single()

    const isPro = hasProAccess(profile)

    if (!isPro) {
        return NextResponse.json(
            { error: 'Cover Letter generation is a Pro feature. Please upgrade.' },
            { status: 403 }
        )
    }

    try {
        const { resumeId } = await request.json()

        // Fetch the generation data
        const { data: gen } = await supabase
            .from('resume_generations')
            .select('resume_generated_text, job_text')
            .eq('id', resumeId)
            .eq('user_id', user.id)
            .single()

        if (!gen) {
            return NextResponse.json({ error: 'Resume generation not found' }, { status: 404 })
        }

        // Parse the optimized resume from DB
        let optimizedResume: CanonicalResume
        try {
            optimizedResume = JSON.parse(gen.resume_generated_text) as CanonicalResume
        } catch {
            return NextResponse.json({ error: 'Could not parse saved resume data' }, { status: 500 })
        }

        // Parse job description for structured context
        const jobSpec = await parseJobDescription(gen.job_text, { preferHeuristic: true })

        // Generate cover letter with structured context
        let coverLetter: string
        try {
            coverLetter = await generateCoverLetter(optimizedResume, jobSpec, gen.job_text)
        } catch (error) {
            if (!isQuotaExceededError(error)) throw error
            coverLetter = fallbackCoverLetter(optimizedResume, jobSpec)
        }

        // Save to DB
        await supabase
            .from('resume_generations')
            .update({ cover_letter_text: coverLetter })
            .eq('id', resumeId)

        return NextResponse.json({ coverLetter })

    } catch (error) {
        console.error('[CoverLetter] Error:', error)
        if (isQuotaExceededError(error)) {
            return NextResponse.json(
                { error: 'AI quota exceeded. Please try again later.', code: 'ai_quota_exceeded' },
                { status: 429 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to generate cover letter' },
            { status: 500 }
        )
    }
}
