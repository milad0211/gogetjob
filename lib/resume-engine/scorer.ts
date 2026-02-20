import type { CanonicalResume, JobSpec, ScoreBreakdown } from './types'

function normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function includesTerm(haystack: string, term: string): boolean {
    const normalizedHaystack = normalize(haystack)
    const normalizedTerm = normalize(term)
    if (!normalizedTerm) return false
    return normalizedHaystack.includes(normalizedTerm)
}

function clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)))
}


function scoreKeywordCoverage(resume: CanonicalResume, jobSpec: JobSpec): { score: number; missing: string[] } {
    const source = normalize([
        resume.summary,
        ...resume.skills,
        ...resume.experience.flatMap((exp) => [exp.role, exp.company, ...exp.bullets]),
        ...resume.projects.flatMap((project) => [project.name, project.description, ...project.technologies]),
    ].join(' '))

    const mustHave = Array.from(new Set(jobSpec.mustHaveSkills)).filter(Boolean)
    const niceToHave = Array.from(new Set(jobSpec.niceToHaveSkills)).filter(Boolean)
    const exactPhrases = Array.from(new Set(jobSpec.exactPhrases)).filter(Boolean)

    const matchedMust = mustHave.filter((kw) => includesTerm(source, kw))
    const matchedNice = niceToHave.filter((kw) => includesTerm(source, kw))
    const matchedExact = exactPhrases.filter((phrase) => includesTerm(source, phrase))

    const mustScore = mustHave.length ? (matchedMust.length / mustHave.length) * 100 : 100
    const niceScore = niceToHave.length ? (matchedNice.length / niceToHave.length) * 100 : 100
    const exactScore = exactPhrases.length ? (matchedExact.length / exactPhrases.length) * 100 : 100
    const score = (mustScore * 0.6) + (exactScore * 0.3) + (niceScore * 0.1)

    const missing = [...mustHave, ...exactPhrases].filter((kw) => !includesTerm(source, kw))
    return { score, missing }
}

function scoreStructure(resume: CanonicalResume): number {
    let score = 0
    if (resume.summary.trim().length >= 40) score += 20
    if (resume.skills.length >= 6) score += 20
    if (resume.experience.length >= 1) score += 20
    if (resume.education.length >= 1) score += 20

    const hasBullets = resume.experience.every((exp) => exp.bullets.length >= 2)
    if (hasBullets) score += 20

    return score
}

function scoreEvidence(resume: CanonicalResume, jobSpec: JobSpec): number {
    const keywords = [...jobSpec.mustHaveSkills, ...jobSpec.exactPhrases].filter(Boolean)
    if (keywords.length === 0) return 80

    const bulletPool = resume.experience.flatMap((exp) => exp.bullets)
    let covered = 0
    for (const keyword of keywords) {
        if (bulletPool.some((line) => includesTerm(line, keyword))) covered += 1
    }
    return (covered / keywords.length) * 100
}

function scoreImpactClarity(resume: CanonicalResume): number {
    const bullets = resume.experience.flatMap((exp) => exp.bullets)
    if (bullets.length === 0) return 40

    const actionVerbRatio = bullets.filter((bullet) => /^[A-Z][a-z]+ed\b/.test(bullet.trim())).length / bullets.length
    const hasOutcomeRatio = bullets.filter((bullet) => /\b(increased|reduced|improved|optimized|delivered|launched|drove|saved|scaled)\b/i.test(bullet)).length / bullets.length
    const conciseRatio = bullets.filter((bullet) => bullet.split(/\s+/).length <= 30).length / bullets.length

    return ((actionVerbRatio * 0.35) + (hasOutcomeRatio * 0.35) + (conciseRatio * 0.3)) * 100
}

export function calculateScore(resume: CanonicalResume, jobSpec: JobSpec): ScoreBreakdown {
    const keyword = scoreKeywordCoverage(resume, jobSpec)
    const keywordCoverage = clamp(keyword.score)
    const structureHygiene = clamp(scoreStructure(resume))
    const relevanceEvidence = clamp(scoreEvidence(resume, jobSpec))
    const impactClarity = clamp(scoreImpactClarity(resume))

    const total = clamp(
        (keywordCoverage * 0.35) +
        (structureHygiene * 0.25) +
        (relevanceEvidence * 0.25) +
        (impactClarity * 0.15)
    )

    return {
        total,
        keywordCoverage,
        structureHygiene,
        relevanceEvidence,
        impactClarity,
        details: {
            missingPhrases: keyword.missing.slice(0, 20),
        },
    }
}
