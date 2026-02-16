import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromPdf } from '@/lib/resume-engine/extractor'
import { calculateScore } from '@/lib/resume-engine/scorer'
import { rewriteResume } from '@/lib/resume-engine/ai'

export const runtime = 'nodejs' // Force Node.js runtime for pdf-parse compatibility

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // [NEW] Rate Limiting
        // const { success } = await ratelimit.limit(user.id)
        // if (!success) {
        //   return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        // }

        // 1. Check Limits (Free/Pro)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

        const isPro = profile?.plan === 'pro'
        const freeUsed = profile?.free_generations_used || 0

        if (!isPro && freeUsed >= 3) {
            return NextResponse.json({ error: 'Upgrade required', code: 'limit_reached' }, { status: 402 })
        }

        // 2. Parse Input
        const formData = await req.formData()
        const file = formData.get('file') as File
        const jobMode = formData.get('jobMode') as string
        const jobUrl = formData.get('jobUrl') as string
        const jobTextInit = formData.get('jobText') as string

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

        // 3. Extract Resume Text
        const arrayBuffer = await file.arrayBuffer()
        const resumeText = await extractTextFromPdf(Buffer.from(arrayBuffer))
        if (!resumeText || resumeText.length < 50) {
            return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 })
        }

        // 4. Handle Job Description (Scrape or Paste)
        let finalJobText = jobTextInit
        if (jobMode === 'url' && jobUrl) {
            // TODO: Implement simple fetch/scrape. For now, fallback or simple fetch.
            // Only failing if empty.
            if (!finalJobText) {
                try {
                    const res = await fetch(jobUrl)
                    if (!res.ok) throw new Error('Fetch failed')
                    const html = await res.text()
                    // Very basic strip tags for MVP
                    finalJobText = html.replace(/<[^>]*>?/gm, ' ').substring(0, 10000)
                } catch (e) {
                    return NextResponse.json({ error: 'Could not fetch URL. Please paste text.', code: 'scrape_failed' }, { status: 400 })
                }
            }
        }

        // 5. Analysis & Rewrite
        const analysis = calculateScore(finalJobText, resumeText)
        let writtenResume
        try {
            writtenResume = await rewriteResume(resumeText, finalJobText)
        } catch (aiError) {
            console.error('AI Processing Failed:', aiError)
            return NextResponse.json({ error: 'AI Service Unavailable. Please try again.', code: 'ai_overload' }, { status: 503 })
        }

        // 6. DB Record
        const { data: gen, error } = await supabase.from('resume_generations').insert({
            user_id: user.id,
            job_source: jobMode,
            job_url: jobUrl,
            job_text: finalJobText,
            resume_original_text: resumeText,
            resume_generated_text: JSON.stringify(writtenResume),
            analysis_json: analysis,
            status: 'success'
        }).select().single()

        if (error) throw error

        // 7. Increment Usage
        if (!isPro) {
            await supabase.from('profiles').update({ free_generations_used: freeUsed + 1 }).eq('id', user.id)
        }

        return NextResponse.json({ id: gen.id, analysis })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
