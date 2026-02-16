import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Pro Status
    const { data: profile } = await (await supabase)
        .from('profiles')
        .select('plan, subscription_status')
        .eq('id', user.id)
        .single()

    const isPro = profile?.plan === 'pro' // && profile?.subscription_status === 'active'

    if (!isPro) {
        return NextResponse.json(
            { error: 'Cover Letter generation is a Pro feature. Please upgrade.' },
            { status: 403 }
        )
    }

    try {
        const { resumeId } = await request.json()

        // Fetch the generation data to get resume text and job text
        const { data: gen } = await (await supabase)
            .from('resume_generations')
            .select('resume_original_text, job_text')
            .eq('id', resumeId)
            .eq('user_id', user.id)
            .single()

        if (!gen) {
            return NextResponse.json({ error: 'Resume generation not found' }, { status: 404 })
        }

        const systemPrompt = `You are an expert career coach and professional writer. 
    Write a compelling, professional cover letter based on the candidate's resume and the job description.
    
    Rules:
    1. Tone: Professional, enthusiastic, and confident.
    2. Format: Standard cover letter format (Dear Hiring Manager, Body, Conclusion, Sign-off).
    3. Content: Highlight specific achievements from the resume that match the job requirements.
    4. Length: 300-400 words.
    5. Do NOT use placeholders like [Your Name] if you can find the name in the resume. If not, use generic placeholders.
    6. Output format: Markdown.`

        const userMessage = `
    RESUME CONTENT:
    ${gen.resume_original_text.substring(0, 3000)}

    JOB DESCRIPTION:
    ${gen.job_text.substring(0, 3000)}
    `

        const result = await geminiModel.generateContent({
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + "\n" + userMessage }] }
            ]
        })

        const coverLetter = result.response.text()

        // Save to DB
        await (await supabase)
            .from('resume_generations')
            .update({ cover_letter_text: coverLetter })
            .eq('id', resumeId)

        return NextResponse.json({ coverLetter })

    } catch (error) {
        console.error('Cover Letter Gen Error:', error)
        return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
    }
}
