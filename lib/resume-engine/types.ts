export const ENGINE_VERSION = '2.0.0'
export const PROMPT_VERSION = '2.0.0'
export const MODEL_NAME = 'gemini-2.5-flash-lite'

export const CONFIDENCE_THRESHOLDS = {
    REJECT: 45,
    REVIEW: 65,
    AUTO_ACCEPT: 80,
} as const

export const BULLET_RULES = {
    MIN_BULLETS_PER_ROLE: 2,
    MAX_BULLETS_PER_ROLE: 8,
    MAX_WORDS_PER_BULLET: 28,
    MAX_VERB_REPETITIONS: 3,
} as const

export const POWER_VERBS = [
    'Implemented', 'Developed', 'Optimized', 'Designed', 'Built', 'Architected',
    'Automated', 'Integrated', 'Refactored', 'Delivered', 'Improved', 'Led',
    'Collaborated', 'Scaled', 'Reduced', 'Accelerated', 'Analyzed', 'Created',
    'Deployed', 'Enhanced', 'Established', 'Executed', 'Migrated', 'Streamlined',
]

export type MatchedKeywordLocation =
    | 'skills'
    | 'experience'
    | 'projects'
    | 'summary'
    | 'certifications'

export interface CanonicalResume {
    contact: {
        name: string
        email: string
        phone?: string
        linkedin?: string
        location?: string
    }
    summary: string
    experience: Array<{
        role: string
        company: string
        startDate: string
        endDate: string
        bullets: string[]
    }>
    projects: Array<{
        name: string
        description: string
        technologies: string[]
    }>
    skills: string[]
    education: Array<{
        degree: string
        school: string
        date: string
    }>
    certifications: string[]
    photo?: {
        dataUrl: string
        source: 'uploaded' | 'extracted' | 'unknown'
    }
}

export interface ParseResult {
    resume: CanonicalResume
    confidence: number
    warnings: string[]
    missingFields: string[]
    evidenceSkills: string[]
}

export interface JobSpec {
    title: string
    companyName: string
    location: string
    mustHaveSkills: string[]
    niceToHaveSkills: string[]
    exactPhrases: string[]
    responsibilities: string[]
    domainTerms: string[]
}

export interface GapReport {
    matchedKeywords: Array<{
        keyword: string
        foundIn: MatchedKeywordLocation[]
    }>
    missingKeywords: string[]
    recommendations: string[]
}

export interface ScoreDetails {
    missingPhrases: string[]
}

export interface ScoreBreakdown {
    total: number
    keywordCoverage: number
    structureHygiene: number
    relevanceEvidence: number
    impactClarity: number
    details: ScoreDetails
}

export interface EngineMetadata {
    engine_version: string
    prompt_version: string
    model_used: string
    quality_gate_status: 'passed' | 'warning' | 'failed'
    quality_gate_issues: string[]
    parser_confidence: number
    parser_warnings: string[]
    parser_missing_fields: string[]
    failure_reason?: string
}

export interface FullAnalysis {
    beforeScore: ScoreBreakdown
    afterScore: ScoreBreakdown
    gapReport: GapReport
    metadata: EngineMetadata
}

