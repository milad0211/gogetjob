import { geminiModel } from '@/lib/gemini'
import type { CanonicalResume, EvidenceMap, ParseResult } from './types'

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/
const LINKEDIN_PATTERN = /(linkedin\.com\/[^\s]+)/i
const URL_PATTERN = /\bhttps?:\/\/[^\s)]+/gi
const METRIC_PATTERN = /\b\d+(?:[.,]\d+)?%?\b/g

type ParsedResumePayload = {
    contact?: { name?: string; email?: string; phone?: string; linkedin?: string; location?: string }
    summary?: string
    experience?: Array<{ role?: string; company?: string; startDate?: string; endDate?: string; bullets?: string[] }>
    projects?: Array<{ name?: string; description?: string; technologies?: string[]; url?: string }>
    skills?: string[]
    education?: Array<{ degree?: string; school?: string; date?: string }>
    certifications?: string[]
}

const SECTION_HEADERS = {
    experience: /^(experience|work experience|professional experience|employment|سوابق کاری|تجربه کاری)$/i,
    projects: /^(projects|project experience|personal projects|portfolio|نمونه کار|پروژه)/i,
    education: /^(education|academic background|تحصیلات)$/i,
}

function normalizeForMatch(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function includesNormalized(rawNormalized: string, value: string): boolean {
    const normalizedValue = normalizeForMatch(value)
    if (!normalizedValue) return false
    return rawNormalized.includes(normalizedValue)
}

function isDateBackedByRawText(rawText: string, value: string): boolean {
    const normalizedValue = value.trim()
    if (!normalizedValue) return false
    const rawLower = rawText.toLowerCase()
    if (rawLower.includes(normalizedValue.toLowerCase())) return true

    const yearTokens = normalizedValue.match(/\b(19|20)\d{2}\b/g) || []
    if (yearTokens.length > 0) {
        return yearTokens.every((year) => rawLower.includes(year))
    }

    return includesNormalized(normalizeForMatch(rawText), normalizedValue)
}

function splitLinesForHeuristic(rawText: string): string[] {
    return rawText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
}

function extractSection(lines: string[], headerRegex: RegExp): string[] {
    const startIndex = lines.findIndex((line) => headerRegex.test(line))
    if (startIndex === -1) return []

    const out: string[] = []
    for (let i = startIndex + 1; i < lines.length; i += 1) {
        const line = lines[i]
        if (
            SECTION_HEADERS.experience.test(line) ||
            SECTION_HEADERS.projects.test(line) ||
            SECTION_HEADERS.education.test(line)
        ) {
            break
        }
        out.push(line)
    }
    return out
}

function heuristicExperienceFromRaw(rawText: string): CanonicalResume['experience'] {
    const lines = extractSection(splitLinesForHeuristic(rawText), SECTION_HEADERS.experience)
    if (lines.length === 0) return []

    const entries: CanonicalResume['experience'] = []
    let current: CanonicalResume['experience'][number] | null = null

    for (const line of lines) {
        const bulletLike = /^[-•*]/.test(line)
        if (bulletLike && current) {
            current.bullets.push(line.replace(/^[-•*]\s*/, '').trim())
            continue
        }

        const hasDate = /\b(19|20)\d{2}\b/.test(line) || /\bpresent\b/i.test(line)
        const atMatch = line.match(/^(.+?)\s+at\s+(.+?)(?:\s+[-|]\s+(.+))?$/i)

        if (atMatch && hasDate) {
            if (current) entries.push(current)
            current = {
                role: atMatch[1]?.trim() || '',
                company: atMatch[2]?.trim() || '',
                startDate: (atMatch[3]?.match(/\b(19|20)\d{2}\b/) || [''])[0],
                endDate: /\bpresent\b/i.test(atMatch[3] || '') ? 'Present' : '',
                bullets: [],
            }
            continue
        }

        if (hasDate && /[|]/.test(line)) {
            const parts = line.split('|').map((part) => part.trim())
            if (parts.length >= 2) {
                if (current) entries.push(current)
                current = {
                    role: parts[0] || '',
                    company: parts[1] || '',
                    startDate: (line.match(/\b(19|20)\d{2}\b/) || [''])[0],
                    endDate: '',
                    bullets: [],
                }
            }
        }
    }

    if (current) entries.push(current)
    return entries.filter((entry) => entry.role || entry.company || entry.bullets.length > 0)
}

function heuristicEducationFromRaw(rawText: string): CanonicalResume['education'] {
    const lines = extractSection(splitLinesForHeuristic(rawText), SECTION_HEADERS.education)
    if (lines.length === 0) return []

    return lines
        .filter((line) => /(university|college|school|دانشگاه|موسسه)/i.test(line))
        .map((line) => {
            const year = (line.match(/\b(19|20)\d{2}\b/) || [''])[0]
            const degree = /(b\.?sc|m\.?sc|phd|bachelor|master|associate|کارشناسی|ارشد|دکترا)/i.test(line)
                ? line
                : ''
            return {
                degree: degree.trim(),
                school: line.trim(),
                date: year,
            }
        })
        .filter((edu) => edu.school)
}

function heuristicProjectsFromRaw(rawText: string): CanonicalResume['projects'] {
    const lines = extractSection(splitLinesForHeuristic(rawText), SECTION_HEADERS.projects)
    if (lines.length === 0) return []

    return lines
        .filter((line) => line.length > 5)
        .slice(0, 12)
        .map((line) => {
            const url = (line.match(URL_PATTERN) || [])[0] || ''
            const cleaned = line.replace(URL_PATTERN, '').trim()
            const [name, ...rest] = cleaned.split(/[:\-–]/)
            return {
                name: (name || '').trim(),
                description: rest.join(' - ').trim(),
                technologies: [],
                url: url || undefined,
            }
        })
        .filter((project) => project.name || project.description || project.url)
}

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
    const weakExperienceFacts = resume.experience.filter((exp) => !exp.role || !exp.company).length
    const weakEducationFacts = resume.education.filter((edu) => !edu.school || !edu.degree).length
    score -= Math.min(20, weakExperienceFacts * 4)
    score -= Math.min(12, weakEducationFacts * 3)
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

function getErrorDetails(error: unknown): { status?: number; message: string } {
    if (!error || typeof error !== 'object') return { message: String(error || '') }
    const maybe = error as { status?: number; message?: string }
    return { status: maybe.status, message: maybe.message || '' }
}

async function aiParseResume(text: string, maxRetries = 2): Promise<ParsedResumePayload> {
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
    let lastError: unknown = null

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
        } catch (error: unknown) {
            lastError = error
            const details = getErrorDetails(error)
            console.error(`[AI Parser] Attempt ${attempt + 1} failed: ${details.message}`)

            const message = details.message.toLowerCase()
            const isRateLimit = details.status === 429 || message.includes('quota') || message.includes('too many requests')

            if (isRateLimit) {
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
                    console.log(`[AI Parser] Rate limited. Waiting ${Math.round(delay)}ms before retry...`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                } else {
                    throw new Error('AI API rate limit exceeded. Please check your API quota or wait a few minutes.')
                }
            } else if (details.status === 403) {
                throw new Error('AI API access forbidden (403). Check API key or IP restrictions (VPN required in some regions).')
            } else {
                throw error
            }
        }
        attempt++
    }

    if (lastError instanceof Error) throw lastError
    throw new Error('Failed to parse resume with AI')
}

// ── Evidence Pool Extraction ──
function extractEvidenceSkills(canonical: CanonicalResume, rawText: string): string[] {
    const evidenceSkills = new Set<string>()
    const rawCorpus = rawText.toLowerCase()

    canonical.skills.forEach(skill => {
        const normalizedSkill = skill.trim()
        if (!normalizedSkill) return
        if (rawCorpus.includes(normalizedSkill.toLowerCase())) {
            evidenceSkills.add(normalizedSkill)
        }
    })

    return Array.from(evidenceSkills)
}

function unique(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function extractLinks(rawText: string, canonical: CanonicalResume): string[] {
    const fromRaw = rawText.match(URL_PATTERN) || []
    const fromFields = [
        canonical.contact.linkedin || '',
        ...canonical.projects.flatMap((project) => [project.name, project.description]),
        ...canonical.experience.flatMap((exp) => exp.bullets),
    ].flatMap((value) => value.match(URL_PATTERN) || [])

    return unique([...fromRaw, ...fromFields])
}

function extractMetrics(rawText: string): string[] {
    const matches = rawText.match(METRIC_PATTERN) || []
    return unique(matches)
}

function buildEvidenceMap(
    canonical: CanonicalResume,
    rawText: string,
    evidenceSkills: string[]
): EvidenceMap {
    const rawCorpus = rawText.toLowerCase()
    const isBackedByRawText = (value: string): boolean => {
        const normalized = value.trim().toLowerCase()
        if (!normalized) return false
        return rawCorpus.includes(normalized)
    }

    const evidenceProjects = canonical.projects.filter((project) => {
        return isBackedByRawText(project.name) ||
            isBackedByRawText(project.description) ||
            project.technologies.some((tech) => isBackedByRawText(tech)) ||
            Boolean(project.url && isBackedByRawText(project.url))
    })

    return {
        entities: {
            experiences: canonical.experience.map((exp) => ({
                role: exp.role || '',
                company: exp.company || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
            })),
            education: canonical.education.map((edu) => ({
                degree: edu.degree || '',
                school: edu.school || '',
                date: edu.date || '',
            })),
        },
        skills: unique(evidenceSkills),
        projects: evidenceProjects.map((project) => ({
            name: project.name || '',
            description: project.description || '',
            technologies: Array.isArray(project.technologies) ? unique(project.technologies) : [],
            url: project.url || undefined,
        })),
        links: extractLinks(rawText, canonical),
        metrics: extractMetrics(rawText),
    }
}

function verifyEntitiesAgainstRawText(resume: CanonicalResume, rawText: string, warnings: string[]): CanonicalResume {
    const rawNormalized = normalizeForMatch(rawText)

    resume.experience = resume.experience
        .map((exp, index) => {
            const companyBacked = exp.company ? includesNormalized(rawNormalized, exp.company) : true
            const roleBacked = exp.role ? includesNormalized(rawNormalized, exp.role) : true
            const startBacked = exp.startDate ? isDateBackedByRawText(rawText, exp.startDate) : true
            const endBacked = exp.endDate ? isDateBackedByRawText(rawText, exp.endDate) : true

            if (!companyBacked) warnings.push(`Verification: experience[${index}].company not found in source text`)
            if (!roleBacked) warnings.push(`Verification: experience[${index}].role not found in source text`)
            if (!startBacked) warnings.push(`Verification: experience[${index}].startDate not found in source text`)
            if (!endBacked) warnings.push(`Verification: experience[${index}].endDate not found in source text`)

            return {
                ...exp,
                company: companyBacked ? exp.company : '',
                role: roleBacked ? exp.role : '',
                startDate: startBacked ? exp.startDate : '',
                endDate: endBacked ? exp.endDate : '',
            }
        })
        .filter((exp) => exp.role || exp.company || exp.bullets.length > 0)

    resume.education = resume.education
        .map((edu, index) => {
            const schoolBacked = edu.school ? includesNormalized(rawNormalized, edu.school) : true
            const degreeBacked = edu.degree ? includesNormalized(rawNormalized, edu.degree) : true
            const dateBacked = edu.date ? isDateBackedByRawText(rawText, edu.date) : true

            if (!schoolBacked) warnings.push(`Verification: education[${index}].school not found in source text`)
            if (!degreeBacked) warnings.push(`Verification: education[${index}].degree not found in source text`)
            if (!dateBacked) warnings.push(`Verification: education[${index}].date not found in source text`)

            return {
                ...edu,
                school: schoolBacked ? edu.school : '',
                degree: degreeBacked ? edu.degree : '',
                date: dateBacked ? edu.date : '',
            }
        })
        .filter((edu) => edu.school || edu.degree)

    return resume
}

export async function parseResume(text: string): Promise<ParseResult> {
    const lines = text.split('\n').map(normalizeLine).filter(Boolean)
    const rawText = lines.join('\n')

    // Step A: Heuristics extraction for anchors
    const anchorEmail = (rawText.match(EMAIL_PATTERN) || [])[0] || ''
    const anchorPhone = (rawText.match(PHONE_PATTERN) || [])[0] || ''
    const anchorLinkedin = (rawText.match(LINKEDIN_PATTERN) || [])[0] || ''

    // Step B: AI Structuring
    let aiParsed: ParsedResumePayload
    try {
        aiParsed = await aiParseResume(rawText)
    } catch (error) {
        console.error('[Parser] AI Parsing failed:', error)
        throw error // Throw to route handler to send 400/500 to user
    }

    const warnings: string[] = []

    // Map AI output to CanonicalResume
    let resume: CanonicalResume = {
        contact: {
            name: aiParsed.contact?.name || '',
            email: anchorEmail || aiParsed.contact?.email || '',
            phone: anchorPhone || aiParsed.contact?.phone || '',
            linkedin: anchorLinkedin || aiParsed.contact?.linkedin || '',
            location: aiParsed.contact?.location || '',
        },
        summary: aiParsed.summary || '',
        experience: Array.isArray(aiParsed.experience) ? aiParsed.experience.map((exp) => ({
            role: exp.role || '',
            company: exp.company || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
        })) : [],
        projects: Array.isArray(aiParsed.projects) ? aiParsed.projects.map((proj) => ({
            name: proj.name || '',
            description: proj.description || '',
            technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
            url: proj.url || undefined,
        })) : [],
        skills: Array.isArray(aiParsed.skills) ? aiParsed.skills : [],
        education: Array.isArray(aiParsed.education) ? aiParsed.education.map((edu) => ({
            degree: edu.degree || '',
            school: edu.school || '',
            date: edu.date || '',
        })) : [],
        certifications: Array.isArray(aiParsed.certifications) ? aiParsed.certifications : [],
    }

    resume = verifyEntitiesAgainstRawText(resume, rawText, warnings)

    if (resume.experience.length === 0) {
        const fallbackExperience = heuristicExperienceFromRaw(rawText)
        if (fallbackExperience.length > 0) {
            resume.experience = fallbackExperience
            warnings.push('Heuristic recovery used for experience section')
        }
    }

    if (resume.education.length === 0) {
        const fallbackEducation = heuristicEducationFromRaw(rawText)
        if (fallbackEducation.length > 0) {
            resume.education = fallbackEducation
            warnings.push('Heuristic recovery used for education section')
        }
    }

    if (resume.projects.length === 0) {
        const fallbackProjects = heuristicProjectsFromRaw(rawText)
        if (fallbackProjects.length > 0) {
            resume.projects = fallbackProjects
            warnings.push('Heuristic recovery used for projects section')
        }
    }

    if (!resume.contact.name) warnings.push('Could not confidently detect candidate name')
    if (resume.experience.length === 0 || resume.experience.every((exp) => exp.bullets.length === 0)) warnings.push('Experience bullets were sparse')
    if (resume.skills.length === 0) warnings.push('No explicit skills section detected')

    const missingFields = buildMissingFields(resume)
    const confidence = computeConfidence(resume, warnings)
    const evidenceSkills = extractEvidenceSkills(resume, rawText)
    const evidenceMap = buildEvidenceMap(resume, rawText, evidenceSkills)
    resume.portfolioLinks = evidenceMap.links
    const safeModeRequired =
        resume.experience.length === 0 ||
        resume.education.length === 0 ||
        warnings.some((warning) => warning.startsWith('Verification:'))

    return {
        resume,
        confidence,
        warnings,
        missingFields,
        evidenceSkills,
        evidenceMap,
        safeModeRequired,
    }
}
