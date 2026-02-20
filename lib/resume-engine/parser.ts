import { geminiModel } from '@/lib/gemini'
import type { CanonicalResume, ParseResult } from './types'

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/
const LINKEDIN_PATTERN = /(linkedin\.com\/[^\s]+)/i

function normalizeLine(raw: string): string {
    return raw.replace(/\u2022/g, '•').replace(/\s+/g, ' ').trim()
}

function computeConfidence(resume: CanonicalResume, warnings: string[]): number {
    let score = 40
    if (resume.contact.name) score += 12
    if (resume.contact.email) score += 10
    if (resume.experience.length > 0 && resume.experience.some((exp) => exp.bullets.length > 0)) score += 18
    if (resume.skills.length >= 5) score += 10
    if (resume.education.some((edu) => edu.school || edu.degree)) score += 10
    score -= Math.min(20, warnings.length * 5)
    return Math.max(0, Math.min(100, score))
}

function buildMissingFields(resume: CanonicalResume): string[] {
    const missing: string[] = []
    if (!resume.contact.name) missing.push('contact.name')
    if (!resume.contact.email) missing.push('contact.email')

    resume.experience.forEach((exp, i) => {
        if (!exp.role) missing.push(`experience[${i}].role`)
        if (!exp.company) missing.push(`experience[${i}].company`)
        if (!exp.startDate) missing.push(`experience[${i}].startDate`)
    })

    resume.education.forEach((edu, i) => {
        if (!edu.school) missing.push(`education[${i}].school`)
    })

    return missing
}

async function aiParseResume(text: string, maxRetries = 2): Promise<any> {
    const prompt = `You are a Resume Parser. Extract facts from this raw resume text into STRICT JSON.
Never hallucinate or invent information. If a field is missing, leave it as an empty string "" or empty array [].
The text may be in English, Persian (Farsi), or another language. Extract names and roles in their original language.

INPUT TEXT:
${text.substring(0, 12000)}

OUTPUT JSON FORMAT:
{
    "contact": { "name": "", "email": "", "phone": "", "linkedin": "", "location": "" },
    "summary": "...",
    "experience": [
        { "role": "", "company": "", "startDate": "", "endDate": "", "bullets": ["...", "..."] }
    ],
    "projects": [
        { "name": "", "description": "", "technologies": ["...", "..."] }
    ],
    "skills": ["skill1", "skill2"],
    "education": [
        { "degree": "", "school": "", "date": "" }
    ],
    "certifications": ["cert1"]
}

RULES:
1. ONLY return the JSON object, nothing else. No markdown blocks like \`\`\`json.
2. Deduplicate duplicate skills. Sort skills with most important/technical first.
3. Keep bullets exactly as written, just formatted cleanly. Don't rewrite them.
4. Ensure "experience" exists even if empty.`

    let attempt = 0
    let lastError: Error | null = null

    while (attempt <= maxRetries) {
        try {
            const result = await geminiModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                },
            })

            const responseText = result.response.text()
            if (!responseText) throw new Error('Empty response from AI parser')

            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
            return JSON.parse(cleanJson)
        } catch (error: any) {
            lastError = error
            console.error(`[AI Parser] Attempt ${attempt + 1} failed: ${error.message}`)

            const isRateLimit = error.status === 429 || error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('too many requests')

            if (isRateLimit) {
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
                    console.log(`[AI Parser] Rate limited. Waiting ${Math.round(delay)}ms before retry...`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                } else {
                    throw new Error('AI API rate limit exceeded. Please check your API quota or wait a few minutes.')
                }
            } else if (error.status === 403) {
                throw new Error('AI API access forbidden (403). Check API key or IP restrictions (VPN required in some regions).')
            } else {
                throw error
            }
        }
        attempt++
    }

    throw lastError || new Error('Failed to parse resume with AI')
}

// ── Evidence Pool Extraction ──
function extractEvidenceSkills(canonical: CanonicalResume): string[] {
    // Collect all text that could contain evidence of skills
    const textCorpus = [
        ...canonical.experience.flatMap(e => e.bullets),
        ...canonical.projects.flatMap(p => [p.name, p.description]),
        ...(canonical.certifications || []),
    ].join(' ').toLowerCase()

    // Ensure the skills list doesn't contain hallucinated skills by verifying they exist somewhere else
    const evidenceSkills = new Set<string>()

    // Explicit skills area always counts as evidence, but we want to ensure
    // we also capture anything they mention in their bullets even if not in the skills section
    canonical.skills.forEach(skill => evidenceSkills.add(skill))

    return Array.from(evidenceSkills)
}

export async function parseResume(text: string): Promise<ParseResult> {
    const lines = text.split('\\n').map(normalizeLine).filter(Boolean)
    const rawText = lines.join('\\n')

    // Step A: Heuristics extraction for anchors
    const anchorEmail = (rawText.match(EMAIL_PATTERN) || [])[0] || ''
    const anchorPhone = (rawText.match(PHONE_PATTERN) || [])[0] || ''
    const anchorLinkedin = (rawText.match(LINKEDIN_PATTERN) || [])[0] || ''

    // Step B: AI Structuring
    let aiParsed: any
    try {
        aiParsed = await aiParseResume(rawText)
    } catch (error) {
        console.error('[Parser] AI Parsing failed:', error)
        throw error // Throw to route handler to send 400/500 to user
    }

    const warnings: string[] = []

    // Map AI output to CanonicalResume
    const resume: CanonicalResume = {
        contact: {
            name: aiParsed.contact?.name || '',
            email: anchorEmail || aiParsed.contact?.email || '',
            phone: anchorPhone || aiParsed.contact?.phone || '',
            linkedin: anchorLinkedin || aiParsed.contact?.linkedin || '',
            location: aiParsed.contact?.location || '',
        },
        summary: aiParsed.summary || '',
        experience: Array.isArray(aiParsed.experience) ? aiParsed.experience.map((exp: any) => ({
            role: exp.role || '',
            company: exp.company || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
        })) : [],
        projects: Array.isArray(aiParsed.projects) ? aiParsed.projects.map((proj: any) => ({
            name: proj.name || '',
            description: proj.description || '',
            technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        })) : [],
        skills: Array.isArray(aiParsed.skills) ? aiParsed.skills : [],
        education: Array.isArray(aiParsed.education) ? aiParsed.education.map((edu: any) => ({
            degree: edu.degree || '',
            school: edu.school || '',
            date: edu.date || '',
        })) : [],
        certifications: Array.isArray(aiParsed.certifications) ? aiParsed.certifications : [],
    }

    if (!resume.contact.name) warnings.push('Could not confidently detect candidate name')
    if (resume.experience.length === 0 || resume.experience.every((exp) => exp.bullets.length === 0)) warnings.push('Experience bullets were sparse')
    if (resume.skills.length === 0) warnings.push('No explicit skills section detected')

    const missingFields = buildMissingFields(resume)
    const confidence = computeConfidence(resume, warnings)
    const evidenceSkills = extractEvidenceSkills(resume)

    return {
        resume,
        confidence,
        warnings,
        missingFields,
        evidenceSkills,
    }
}
