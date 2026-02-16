export interface AnalysisResult {
    match_score: number
    missing_keywords: string[]
    matched_keywords: string[]
    structure_score: number
    clarity_score: number
}

// Simple English stopwords + some common resume filler words
const STOP_WORDS = new Set([
    'and', 'the', 'of', 'in', 'to', 'a', 'with', 'for', 'on', 'as', 'by',
    'an', 'be', 'is', 'are', 'was', 'were', 'that', 'this', 'it', 'or',
    'experience', 'work', 'job', 'role', 'responsibilities', 'team', 'years'
])

export function calculateScore(jobText: string, resumeText: string): AnalysisResult {
    const jobTokens = tokenize(jobText)
    const resumeTokens = new Set(tokenize(resumeText))

    // 1. Identify "Keywords" (Nouns/Important terms) from JD
    // In a real app, use NLP. Here, we filter by length and stop words.
    const keywords = jobTokens.filter(t => t.length > 4 && !STOP_WORDS.has(t))
    const uniqueKeywords = Array.from(new Set(keywords))

    // 2. Calculate Coverage
    const matched = uniqueKeywords.filter(k => resumeTokens.has(k))
    const missing = uniqueKeywords.filter(k => !resumeTokens.has(k))

    const coverage = uniqueKeywords.length > 0
        ? (matched.length / uniqueKeywords.length) * 100
        : 0

    // 3. Structure Check
    const hasSummary = /summary|profile|about/i.test(resumeText)
    const hasExperience = /experience|employment|work history/i.test(resumeText)
    const hasSkills = /skills|technologies|competencies/i.test(resumeText)

    let structureScore = 0
    if (hasSummary) structureScore += 25
    if (hasExperience) structureScore += 50
    if (hasSkills) structureScore += 25

    // 4. Clarity (Avg sentence / bullet length) - Mocked for MVP efficiency
    const clarityScore = 80 // Assume "good enough" for now or implement regex for bullet length

    // Weighted Total: Coverage(60%) + Structure(20%) + Clarity(20%)
    const finalScore = Math.round((coverage * 0.6) + (structureScore * 0.2) + (clarityScore * 0.2))

    return {
        match_score: Math.min(100, finalScore),
        matched_keywords: matched.slice(0, 10), // Top 10
        missing_keywords: missing.slice(0, 10), // Top 10
        structure_score: structureScore,
        clarity_score: clarityScore
    }
}

function tokenize(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/)
}
