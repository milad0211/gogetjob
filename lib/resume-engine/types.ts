export const ENGINE_VERSION = '3.0.0'
export const PROMPT_VERSION = '3.0.0'
export const MODEL_NAME = 'gemini-2.5-flash'

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
    // Core Engineering
    'Implemented', 'Developed', 'Optimized', 'Designed', 'Built', 'Architected',
    'Automated', 'Integrated', 'Refactored', 'Delivered', 'Improved', 'Led',
    'Collaborated', 'Scaled', 'Reduced', 'Accelerated', 'Analyzed', 'Created',
    'Deployed', 'Enhanced', 'Established', 'Executed', 'Migrated', 'Streamlined',
    // Leadership & Strategy
    'Spearheaded', 'Orchestrated', 'Pioneered', 'Championed', 'Mentored',
    'Directed', 'Coordinated', 'Initiated', 'Transformed', 'Overhauled',
    // Problem Solving
    'Resolved', 'Diagnosed', 'Troubleshot', 'Debugged', 'Identified',
    'Investigated', 'Remediated', 'Mitigated', 'Eliminated', 'Addressed',
    // Communication & Impact
    'Presented', 'Documented', 'Communicated', 'Advocated', 'Facilitated',
    'Translated', 'Published', 'Reported', 'Trained', 'Onboarded',
    // Growth & Innovation
    'Launched', 'Prototyped', 'Introduced', 'Modernized', 'Revamped',
    'Engineered', 'Configured', 'Provisioned', 'Consolidated', 'Standardized',
    // Measurement & Quality
    'Achieved', 'Increased', 'Decreased', 'Maintained', 'Ensured',
    'Validated', 'Tested', 'Verified', 'Benchmarked', 'Monitored',
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
        url?: string
    }>
    portfolioLinks?: string[]
    skills: string[]
    education: Array<{
        degree: string
        school: string
        date: string
    }>
    certifications: string[]
    keyAchievements: string[]
    languages: Array<{ language: string; proficiency: string }>
    /** Catch-all for resume sections not explicitly typed (Volunteer, Publications, Awards, Hobbies, etc.) */
    additionalSections: Array<{ title: string; items: string[] }>
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
    evidenceMap: EvidenceMap
    safeModeRequired: boolean
}

export interface EvidenceMap {
    entities: {
        experiences: Array<{
            role: string
            company: string
            startDate: string
            endDate: string
        }>
        education: Array<{
            degree: string
            school: string
            date: string
        }>
    }
    skills: string[]
    projects: Array<{
        name: string
        description: string
        technologies: string[]
        url?: string
    }>
    links: string[]
    metrics: string[]
}

export interface JobSpec {
    title: string
    companyName: string
    location: string
    seniorityLevel: string
    mustHaveSkills: string[]
    niceToHaveSkills: string[]
    softSkills: string[]
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
    transferableSkills: Array<{
        has: string
        mapsTo: string
        strength: 'strong' | 'moderate' | 'weak'
    }>
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
    job_title?: string
    failure_reason?: string
    safe_mode_used?: boolean
}

export interface FullAnalysis {
    beforeScore: ScoreBreakdown
    afterScore: ScoreBreakdown
    gapReport: GapReport
    metadata: EngineMetadata
    safeResume?: CanonicalResume
}
