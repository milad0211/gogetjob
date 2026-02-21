import { geminiModel } from '@/lib/gemini'
import type { JobSpec } from './types'

const COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java',
    'Go', 'C#', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'CI/CD', 'GraphQL', 'REST', 'Microservices', 'Git',
    'Linux', 'Tailwind', 'HTML', 'CSS', 'Testing', 'Jest', 'Cypress', 'SaaS',
    'Agile', 'Scrum', 'Data Analysis', 'Machine Learning', 'NLP',
    'Kotlin', 'Android', 'Jetpack Compose', 'XML', 'Gradle', 'Coroutines',
    'MVVM', 'Retrofit', 'Room', 'Material', 'Cursor', 'Incident Report',
    'Bug Trace', 'Screenshots', 'Slack', 'Alpha Testing',
]

function normalizeText(value: string): string {
    return value
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function unique(values: string[]): string[] {
    return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)))
}

function splitLines(text: string): string[] {
    return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

function extractTitle(lines: string[]): string {
    const byLabel = lines.find((line) => /^title\s*:/i.test(line))
    if (byLabel) return byLabel.replace(/^title\s*:/i, '').trim()

    const roleLike = lines.find((line) =>
        /\b(engineer|developer|manager|designer|analyst|architect|scientist|consultant|specialist)\b/i.test(line) &&
        line.length < 100
    )
    return roleLike || 'Target Role'
}

function extractCompany(lines: string[]): string {
    const byLabel = lines.find((line) => /^company\s*:/i.test(line))
    if (byLabel) return byLabel.replace(/^company\s*:/i, '').trim()

    const atPattern = lines.find((line) => /\bat\s+[A-Z][A-Za-z0-9& .-]{1,60}/.test(line))
    if (atPattern) {
        const match = atPattern.match(/\bat\s+([A-Z][A-Za-z0-9& .-]{1,60})/)
        if (match?.[1]) return match[1].trim()
    }
    return ''
}

function extractLocation(lines: string[]): string {
    const byLabel = lines.find((line) => /^location\s*:/i.test(line))
    if (byLabel) return byLabel.replace(/^location\s*:/i, '').trim()

    const locationLine = lines.find((line) => /\b(remote|hybrid|onsite|on-site)\b/i.test(line))
    return locationLine || ''
}

function extractResponsibilityLines(lines: string[]): string[] {
    return lines
        .filter((line) => /^[-•*]/.test(line) || /\bresponsibilit(y|ies)\b/i.test(line))
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line.length > 15)
        .slice(0, 10)
}

function extractSkillsFromText(text: string): string[] {
    const found: string[] = []
    const lower = text.toLowerCase()

    for (const skill of COMMON_SKILLS) {
        if (lower.includes(skill.toLowerCase())) {
            found.push(skill)
        }
    }

    return unique(found)
}

function extractPhrases(lines: string[]): string[] {
    const phrases: string[] = []
    for (const line of lines) {
        if (line.length < 18 || line.length > 120) continue
        if (!/[a-z]{3,}\s+[a-z]{3,}/i.test(line)) continue
        phrases.push(line.replace(/^[-•*]\s*/, ''))
    }
    return unique(phrases).slice(0, 12)
}

function heuristicParseJobDescription(jobText: string): JobSpec {
    const normalized = normalizeText(jobText)
    const lines = splitLines(normalized)
    const title = extractTitle(lines)
    const companyName = extractCompany(lines)
    const location = extractLocation(lines)
    const responsibilities = extractResponsibilityLines(lines)
    const allSkills = extractSkillsFromText(normalized)

    const mustHaveSkills = allSkills.slice(0, 10)
    const niceToHaveSkills = allSkills.slice(10, 20)
    const exactPhrases = extractPhrases(lines)
    const domainTerms = unique(
        ['agile', 'stakeholder', 'scalable', 'performance', 'architecture', 'product']
            .filter((term) => normalized.toLowerCase().includes(term))
    )

    return {
        title,
        companyName,
        location,
        mustHaveSkills,
        niceToHaveSkills,
        exactPhrases,
        responsibilities,
        domainTerms,
    }
}

async function aiParseJobDescription(jobText: string): Promise<JobSpec> {
    const prompt = `Parse this job description into JSON.

Return only valid JSON with this exact shape:
{
  "title": "string",
  "companyName": "string",
  "location": "string",
  "mustHaveSkills": ["string"],
  "niceToHaveSkills": ["string"],
  "exactPhrases": ["string"],
  "responsibilities": ["string"],
  "domainTerms": ["string"]
}

Job description:
${jobText.substring(0, 10000)}`

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
        },
    })

    const raw = result.response.text()
    if (!raw) throw new Error('Empty response from job parser')

    const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()) as Partial<JobSpec>
    const fallback = heuristicParseJobDescription(jobText)

    return {
        title: parsed.title || fallback.title,
        companyName: parsed.companyName || fallback.companyName,
        location: parsed.location || fallback.location,
        mustHaveSkills: unique(parsed.mustHaveSkills || fallback.mustHaveSkills),
        niceToHaveSkills: unique(parsed.niceToHaveSkills || fallback.niceToHaveSkills),
        exactPhrases: unique(parsed.exactPhrases || fallback.exactPhrases),
        responsibilities: unique(parsed.responsibilities || fallback.responsibilities),
        domainTerms: unique(parsed.domainTerms || fallback.domainTerms),
    }
}

export async function parseJobDescription(
    jobText: string,
    options?: { preferHeuristic?: boolean }
): Promise<JobSpec> {
    if (!jobText || jobText.trim().length < 20) {
        return heuristicParseJobDescription(jobText || '')
    }

    if (options?.preferHeuristic) {
        return heuristicParseJobDescription(jobText)
    }

    try {
        return await aiParseJobDescription(jobText)
    } catch {
        return heuristicParseJobDescription(jobText)
    }
}
