import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/subscription'
import { extractTextFromPdf } from '@/lib/resume-engine/extractor'
import { parseResume } from '@/lib/resume-engine/parser'
import { parseJobDescription } from '@/lib/resume-engine/job-parser'
import { analyzeGap, rewriteResume } from '@/lib/resume-engine/ai'
import { calculateScore } from '@/lib/resume-engine/scorer'
import { validateOutput } from '@/lib/resume-engine/quality-gate'
import type { FullAnalysis, EngineMetadata, ParseResult } from '@/lib/resume-engine/types'
import type { CanonicalResume } from '@/lib/resume-engine/types'
import type { GapReport, JobSpec } from '@/lib/resume-engine/types'
import { ENGINE_VERSION, PROMPT_VERSION, MODEL_NAME, CONFIDENCE_THRESHOLDS } from '@/lib/resume-engine/types'

export const runtime = 'nodejs'

interface ConfirmedFactsPayload {
    name?: string
    email?: string
    experience?: Array<{
        role?: string
        company?: string
        startDate?: string
        endDate?: string
    }>
    education?: Array<{
        degree?: string
        school?: string
        date?: string
    }>
}

function detectMissingFields(resume: CanonicalResume): string[] {
    const missing: string[] = []
    if (!resume.contact?.name) missing.push('contact.name')

    resume.experience.forEach((exp, i) => {
        if (!exp.company) missing.push(`experience[${i}].company`)
        if (!exp.startDate) missing.push(`experience[${i}].startDate`)
        if (!exp.role) missing.push(`experience[${i}].role`)
    })

    resume.education.forEach((edu, i) => {
        if (!edu.school) missing.push(`education[${i}].school`)
        if (!edu.degree) missing.push(`education[${i}].degree`)
    })

    return missing
}

function applyConfirmedFacts(resume: CanonicalResume, facts: ConfirmedFactsPayload | null): CanonicalResume {
    if (!facts) return resume

    if (facts.name !== undefined) resume.contact.name = facts.name
    if (facts.email !== undefined) resume.contact.email = facts.email

    if (facts.experience) {
        resume.experience = resume.experience.map((exp, i) => ({
            ...exp,
            role: facts.experience?.[i]?.role ?? exp.role,
            company: facts.experience?.[i]?.company ?? exp.company,
            startDate: facts.experience?.[i]?.startDate ?? exp.startDate,
            endDate: facts.experience?.[i]?.endDate ?? exp.endDate,
        }))
    }

    if (facts.education) {
        resume.education = resume.education.map((edu, i) => ({
            ...edu,
            degree: facts.education?.[i]?.degree ?? edu.degree,
            school: facts.education?.[i]?.school ?? edu.school,
            date: facts.education?.[i]?.date ?? edu.date,
        }))
    }

    return resume
}

function isQuotaExceededError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const err = error as { message?: string; status?: number; statusText?: string }
    const message = (err.message || '').toLowerCase()
    const statusText = (err.statusText || '').toLowerCase()
    return err.status === 429 || message.includes('quota') || message.includes('too many requests') || statusText.includes('too many requests')
}

function normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildFallbackGapReport(resume: CanonicalResume, jobSpec: JobSpec): GapReport {
    const resumeText = normalizeText([
        resume.summary,
        ...resume.experience.flatMap(exp => [exp.role, exp.company, ...exp.bullets]),
        ...resume.projects.flatMap(project => [project.name, project.description, ...project.technologies]),
        ...resume.skills,
        ...resume.certifications,
    ].join(' '))

    const allKeywords = Array.from(new Set([
        ...jobSpec.mustHaveSkills,
        ...jobSpec.niceToHaveSkills,
        ...jobSpec.exactPhrases,
    ]))

    const matchedKeywords: GapReport['matchedKeywords'] = []
    const missingKeywords: string[] = []
    const experienceBullets = resume.experience.flatMap(exp => exp.bullets)

    for (const keyword of allKeywords) {
        const normalizedKeyword = normalizeText(keyword)
        if (!normalizedKeyword) continue
        const found = resumeText.includes(normalizedKeyword)
        if (!found) {
            missingKeywords.push(keyword)
            continue
        }

        const foundIn: GapReport['matchedKeywords'][number]['foundIn'] = []
        if (resume.skills.some(skill => normalizeText(skill).includes(normalizedKeyword))) foundIn.push('skills')
        if (resume.experience.some(exp => normalizeText([exp.role, exp.company, ...exp.bullets].join(' ')).includes(normalizedKeyword))) foundIn.push('experience')
        if (resume.projects.some(project => normalizeText([project.name, project.description, ...project.technologies].join(' ')).includes(normalizedKeyword))) foundIn.push('projects')
        if (normalizeText(resume.summary).includes(normalizedKeyword)) foundIn.push('summary')
        if (resume.certifications.some(cert => normalizeText(cert).includes(normalizedKeyword))) foundIn.push('certifications')
        if (foundIn.length === 0) foundIn.push('experience')

        matchedKeywords.push({ keyword, foundIn })
    }

    const recommendations = missingKeywords.slice(0, 6).map(keyword => `Add concrete evidence for "${keyword}" in summary or experience bullets`)

    return {
        matchedKeywords,
        missingKeywords,
        recommendations,
    }
}

function buildFallbackRewrite(resume: CanonicalResume, jobSpec: JobSpec): CanonicalResume {
    const jdPriority = jobSpec.mustHaveSkills.map(skill => skill.toLowerCase())
    const reorderedSkills = [...resume.skills].sort((a, b) => {
        const aPriority = jdPriority.some(keyword => a.toLowerCase().includes(keyword)) ? 0 : 1
        const bPriority = jdPriority.some(keyword => b.toLowerCase().includes(keyword)) ? 0 : 1
        return aPriority - bPriority
    })

    const summaryPrefix = resume.summary?.trim()
        ? resume.summary.trim()
        : `Candidate targeting ${jobSpec.title}.`

    return {
        ...resume,
        summary: `${summaryPrefix} Target role alignment: ${jobSpec.title}.`,
        skills: reorderedSkills,
    }
}

export async function POST(req: Request) {
    try {
        // ── Auth ─────────────────────────────────────────────────
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // ── Plan Limits ──────────────────────────────────────────
        const { data: profile } = await supabase.from('profiles').select('plan, subscription_status, free_generations_used').eq('id', user.id).single()
        const isPro = hasProAccess(profile)
        const freeUsed = profile?.free_generations_used || 0

        if (!isPro && freeUsed >= 3) {
            return NextResponse.json({ error: 'Upgrade required', code: 'limit_reached' }, { status: 402 })
        }

        // ── Parse Input ──────────────────────────────────────────
        const formData = await req.formData()
        const file = formData.get('file') as File
        const jobMode = formData.get('jobMode') as string
        const jobUrl = formData.get('jobUrl') as string
        const jobTextInit = formData.get('jobText') as string
        const photoDataUrl = formData.get('photoDataUrl') as string | null
        const confirmedFactsRaw = formData.get('confirmedFacts') as string | null

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

        // File type check
        const mimeType = file.type?.toLowerCase() || ''
        const fileName = file.name?.toLowerCase() || ''
        if (!(mimeType === 'application/pdf' || mimeType === 'application/x-pdf' || fileName.endsWith('.pdf'))) {
            return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
        }

        // File size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size too large. Max 5MB allowed.' }, { status: 400 })
        }

        // ── Step 1: Extract PDF Text ─────────────────────────────
        console.log(`[Engine v${ENGINE_VERSION}] Starting generation for user ${user.id}`)
        const arrayBuffer = await file.arrayBuffer()
        const resumeText = await extractTextFromPdf(Buffer.from(arrayBuffer))

        if (!resumeText || resumeText.length < 50) {
            return NextResponse.json({
                error: 'Could not extract text from PDF (too short or empty)',
                code: 'extraction_error'
            }, { status: 400 })
        }

        // ── Step 2: Get Job Description Text ─────────────────────
        let finalJobText = jobTextInit
        if (jobMode === 'url' && jobUrl) {
            if (!finalJobText) {
                try {
                    const res = await fetch(jobUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResumeBot/1.0)' }
                    })
                    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
                    const html = await res.text()
                    finalJobText = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').substring(0, 10000).trim()
                } catch {
                    return NextResponse.json({
                        error: 'Could not fetch URL. Please paste the job description text instead.',
                        code: 'scrape_failed'
                    }, { status: 400 })
                }
            }
        }

        if (!finalJobText || finalJobText.length < 50) {
            return NextResponse.json({
                error: 'Job description is too short or empty.',
                code: 'validation_error'
            }, { status: 400 })
        }

        // ── API Key Check ────────────────────────────────────────
        if (!process.env.GEMINI_API_KEY) {
            console.error('[Engine] GEMINI_API_KEY is missing')
            return NextResponse.json({
                error: 'AI service not configured.',
                code: 'config_error'
            }, { status: 500 })
        }

        // ── Step 3: Parse Resume → Canonical JSON ────────────────
        console.log(`[Engine] Parsing resume (${resumeText.length} chars)`)
        let parseResult: ParseResult

        try {
            parseResult = await parseResume(resumeText)
        } catch (error) {
            console.error('[Engine] Document parsing failed:', error)

            if (isQuotaExceededError(error)) {
                return NextResponse.json({
                    error: 'AI API quota exceeded while parsing resume. Please try again later or verify your API key limits.',
                    code: 'ai_quota_exceeded'
                }, { status: 429 })
            } else if ((error as any).status === 403) {
                return NextResponse.json({
                    error: 'AI API access forbidden. This might be due to regional restrictions (e.g. your server IP is blocked by Google) or an invalid key. A VPN or proxy may be required.',
                    code: 'api_forbidden'
                }, { status: 403 })
            }

            return NextResponse.json({
                error: 'Could not extract structured data from your resume document. This might be due to an unreadable file format.',
                code: 'parse_error',
            }, { status: 400 })
        }

        if (parseResult.confidence < CONFIDENCE_THRESHOLDS.REJECT) {
            return NextResponse.json({
                error: 'Could not reliably parse this resume. The extracted data has very low confidence. Please try a different PDF layout.',
                code: 'low_confidence_error',
                warnings: parseResult.warnings
            }, { status: 400 })
        }

        if (confirmedFactsRaw) {
            try {
                const confirmedFacts = JSON.parse(confirmedFactsRaw) as ConfirmedFactsPayload
                parseResult.resume = applyConfirmedFacts(parseResult.resume, confirmedFacts)
                parseResult.missingFields = detectMissingFields(parseResult.resume)
            } catch {
                console.warn('[Engine] Invalid confirmedFacts payload; skipping')
            }
        }

        if (photoDataUrl && parseResult.resume) {
            parseResult.resume.photo = { dataUrl: photoDataUrl, source: 'uploaded' }
        }

        // ── Step 4: Parse Job Description → JobSpec ──────────────
        console.log(`[Engine] Parsing job description (${finalJobText.length} chars)`)
        const jobSpec = await parseJobDescription(finalJobText)

        // ── Step 5: Gap Analysis ─────────────────────────────────
        console.log(`[Engine] Running gap analysis`)
        let gapReport: GapReport
        let aiFallbackMode = false
        try {
            gapReport = await analyzeGap(parseResult.resume, jobSpec)
        } catch (error) {
            if (!isQuotaExceededError(error)) throw error
            aiFallbackMode = true
            console.warn('[Engine] AI quota exceeded during gap analysis. Using heuristic fallback.')
            gapReport = buildFallbackGapReport(parseResult.resume, jobSpec)
            parseResult.warnings.push('AI quota exceeded: heuristic gap analysis was used.')
        }

        // ── Step 6: Score BEFORE (original resume) ───────────────
        const beforeScore = calculateScore(parseResult.resume, jobSpec)
        console.log(`[Engine] Before score: ${beforeScore.total}`)

        // ── Step 7: Rewrite Resume ───────────────────────────────
        console.log(`[Engine] Rewriting resume`)
        let rewrittenResume: CanonicalResume
        try {
            rewrittenResume = await rewriteResume(parseResult.resume, jobSpec, gapReport)
        } catch (error) {
            if (!isQuotaExceededError(error)) throw error
            aiFallbackMode = true
            console.warn('[Engine] AI quota exceeded during rewrite. Using heuristic fallback.')
            rewrittenResume = buildFallbackRewrite(parseResult.resume, jobSpec)
            parseResult.warnings.push('AI quota exceeded: heuristic resume rewrite was used.')
        }

        // ── Step 8: Quality Gate ─────────────────────────────────
        const evidencePool = [
            ...parseResult.evidenceSkills,
            ...parseResult.resume.skills,
            ...parseResult.resume.experience.flatMap(e => e.bullets),
            ...parseResult.resume.certifications,
        ]
        const qualityResult = validateOutput(rewrittenResume, parseResult.resume, evidencePool)
        console.log(`[Engine] Quality gate: ${qualityResult.status} (${qualityResult.issues.length} issues)`)

        if (!qualityResult.passed) {
            console.error('[Engine] Quality gate FAILED:', qualityResult.issues)
            // Still save but mark as failed
        }

        // ── Step 9: Score AFTER (rewritten resume) ───────────────
        const afterScore = calculateScore(rewrittenResume, jobSpec)
        console.log(`[Engine] After score: ${afterScore.total} (improvement: +${afterScore.total - beforeScore.total})`)

        // ── Step 10: Build Full Analysis ─────────────────────────
        const metadata: EngineMetadata = {
            engine_version: ENGINE_VERSION,
            prompt_version: PROMPT_VERSION,
            model_used: MODEL_NAME,
            quality_gate_status: qualityResult.status,
            quality_gate_issues: qualityResult.issues,
            parser_confidence: parseResult.confidence,
            parser_warnings: parseResult.warnings,
            parser_missing_fields: parseResult.missingFields,
            failure_reason: aiFallbackMode ? 'ai_quota_exceeded_fallback_mode' : undefined,
        }

        const fullAnalysis: FullAnalysis = {
            beforeScore,
            afterScore,
            gapReport,
            metadata,
        }

        // ── Step 11: Save to DB ──────────────────────────────────
        const { data: gen, error } = await supabase.from('resume_generations').insert({
            user_id: user.id,
            job_source: jobMode,
            job_url: jobUrl,
            job_text: finalJobText,
            resume_original_text: resumeText,
            resume_generated_text: JSON.stringify(rewrittenResume),
            analysis_json: fullAnalysis,
            status: qualityResult.passed ? 'success' : 'failed',
            error_message: qualityResult.passed ? null : qualityResult.issues.join('; '),
        }).select().single()

        if (error) {
            console.error('[Engine] DB error:', error)
            throw error
        }

        // ── Step 12: Increment Usage ─────────────────────────────
        if (!isPro) {
            await supabase.from('profiles').update({
                free_generations_used: freeUsed + 1
            }).eq('id', user.id)
        }

        console.log(`[Engine] Generation complete! ID: ${gen.id}`)

        return NextResponse.json({
            id: gen.id,
            beforeScore: beforeScore.total,
            afterScore: afterScore.total,
            improvement: afterScore.total - beforeScore.total,
            qualityStatus: qualityResult.status,
            parserWarnings: parseResult.warnings,
        })

    } catch (error) {
        console.error('[Engine] Fatal error:', error)
        if (isQuotaExceededError(error)) {
            return NextResponse.json({
                error: 'AI quota exceeded. Please try again later or switch to a paid key.',
                code: 'ai_quota_exceeded',
                details: error instanceof Error ? error.message : 'Quota exceeded',
            }, { status: 429 })
        }
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
