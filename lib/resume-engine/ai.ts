// ======================================================================
// AI Engine v2 — Structured Resume Rewriting
// 1. analyzeGap() — generates evidence-based Gap Report
// 2. rewriteResume() — rewrites on CanonicalJSON with strict rules
// 3. generateCoverLetter() — pro feature with structured context
// ======================================================================

import { geminiModel } from '@/lib/gemini'
import type { CanonicalResume, JobSpec, GapReport } from './types'
import { POWER_VERBS, BULLET_RULES } from './types'

// ── Gap Analysis ─────────────────────────────────────────────────────

export async function analyzeGap(
    canonical: CanonicalResume,
    jobSpec: JobSpec
): Promise<GapReport> {
    const resumeSkills = canonical.skills.join(', ')
    const resumeBullets = canonical.experience.flatMap(e => e.bullets).join('\n')
    const projectsText = canonical.projects?.map(p => `${p.name}: ${p.description} [${p.technologies.join(', ')}]`).join('\n') || ''

    const prompt = `You are a Resume-to-Job gap analyzer.

TASK: Compare the candidate's resume data against the job requirements and produce a gap analysis.

CANDIDATE SKILLS: ${resumeSkills}

CANDIDATE EXPERIENCE BULLETS:
${resumeBullets.substring(0, 4000)}

CANDIDATE PROJECTS:
${projectsText.substring(0, 2000)}

CANDIDATE CERTIFICATIONS: ${canonical.certifications?.join(', ') || 'none'}

JOB REQUIREMENTS:
- Must-have: ${jobSpec.mustHaveSkills.join(', ')}
- Nice-to-have: ${jobSpec.niceToHaveSkills.join(', ')}
- Key phrases: ${jobSpec.exactPhrases.join(', ')}
- Responsibilities: ${jobSpec.responsibilities.join('; ')}

OUTPUT: Return ONLY valid JSON:
{
    "matchedKeywords": [
        { "keyword": "React", "foundIn": ["skills", "experience"] }
    ],
    "missingKeywords": ["keyword1", "keyword2"],
    "recommendations": [
        "Add keyword X to summary",
        "Rewrite bullet Y to highlight Z"
    ]
}

RULES:
1. For matchedKeywords, "foundIn" should be from: "skills", "experience", "projects", "summary", "certifications"
2. missingKeywords = skills/phrases from JD that have NO evidence in the resume at all
3. recommendations = specific, actionable suggestions for the rewrite step`

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
        },
    })

    const responseText = result.response.text()
    if (!responseText) throw new Error('Empty response from gap analyzer')

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanJson) as GapReport

    // Ensure arrays
    if (!parsed.matchedKeywords) parsed.matchedKeywords = []
    if (!parsed.missingKeywords) parsed.missingKeywords = []
    if (!parsed.recommendations) parsed.recommendations = []

    return parsed
}

// ── Resume Rewrite ───────────────────────────────────────────────────

export async function rewriteResume(
    canonical: CanonicalResume,
    jobSpec: JobSpec,
    gapReport: GapReport
): Promise<CanonicalResume> {
    const powerVerbsList = POWER_VERBS.slice(0, 40).join(', ')

    const prompt = `You are an Expert ATS Resume Writer.

TASK: Rewrite the candidate's resume to maximize alignment with the target job, following strict rules.

=== CANDIDATE DATA (FACTS — DO NOT CHANGE) ===
Contact: ${JSON.stringify(canonical.contact)}

Experience (preserve ALL companies, roles, and dates exactly):
${JSON.stringify(canonical.experience, null, 2)}

Projects:
${JSON.stringify(canonical.projects || [], null, 2)}

Skills (original): ${canonical.skills.join(', ')}

Education (preserve exactly): ${JSON.stringify(canonical.education)}

Certifications: ${canonical.certifications?.join(', ') || 'none'}

=== TARGET JOB ===
Title: ${jobSpec.title}
Must-have skills: ${jobSpec.mustHaveSkills.join(', ')}
Nice-to-have: ${jobSpec.niceToHaveSkills.join(', ')}
Key phrases (use verbatim): ${jobSpec.exactPhrases.join(', ')}
Responsibilities: ${jobSpec.responsibilities.join('; ')}
Domain terms: ${jobSpec.domainTerms.join(', ')}

=== GAP ANALYSIS ===
Missing keywords to address: ${gapReport.missingKeywords.join(', ')}
Recommendations: ${gapReport.recommendations.join('; ')}

=== REWRITE RULES (MANDATORY) ===
1. NEVER invent companies, roles, dates, degrees, or schools
2. NEVER add skills the candidate doesn't have evidence for
3. Rewrite ONLY: bullets, summary, and skill ordering/grouping
4. BULLET FORMAT is mandatory for every bullet:
   Action Verb + Scope/Context + Tool/Technology + Outcome
5. Each bullet: max ${BULLET_RULES.MAX_WORDS_PER_BULLET} words
6. Each role: ${BULLET_RULES.MIN_BULLETS_PER_ROLE}-${BULLET_RULES.MAX_BULLETS_PER_ROLE} bullets
7. VERB DIVERSITY: no power verb may appear more than ${BULLET_RULES.MAX_VERB_REPETITIONS} times across ALL bullets.
   Use diverse verbs such as: Implemented, Developed, Refactored, Integrated, Optimized, Designed, Built, Architected, Delivered, Collaborated.
   You may also use this list: ${powerVerbsList}
8. Summary: 3-4 sentences, position candidate for THIS specific job, include top must-have keywords
9. Skills: reorder so JD-relevant skills come first, group by category
10. Use EXACT PHRASES from the JD where naturally applicable (e.g., "${jobSpec.exactPhrases.slice(0, 3).join('", "')}")
11. OUTCOME RULES:
   - If the original resume contains a specific number/percentage, you MAY use it
   - If NO number exists in the original, use qualitative outcomes only
   - NEVER invent numeric outcomes like "increased by 40%" or "reduced by 30%" unless present in original text
12. Prioritize must-have keywords in the first 1-2 bullets of the most relevant experience
13. ANTI-HALLUCINATION (CRITICAL):
   - company, startDate, endDate, role fields must be copied VERBATIM from original JSON
   - school and degree fields must be copied VERBATIM from original JSON
   - NEVER output "Unknown", "N/A", "TBD", or "-"
   - If you don't know a value, output "" (empty string)

=== OUTPUT FORMAT ===
Return ONLY valid JSON with same structure:
{
    "contact": ${JSON.stringify(canonical.contact)},
    "summary": "rewritten summary",
    "experience": [{ "role": "same", "company": "same", "startDate": "same", "endDate": "same", "bullets": ["rewritten"] }],
    "projects": [{ "name": "same", "description": "rewritten", "technologies": ["same"] }],
    "skills": ["reordered and grouped"],
    "education": ${JSON.stringify(canonical.education)},
    "certifications": ${JSON.stringify(canonical.certifications || [])}
}`

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.6,
        },
    })

    const responseText = result.response.text()
    if (!responseText) throw new Error('Empty response from AI rewriter')

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const rewritten = JSON.parse(cleanJson) as CanonicalResume

    // Force-preserve facts that AI must not change
    rewritten.contact = canonical.contact
    rewritten.education = canonical.education
    rewritten.certifications = canonical.certifications || []
    rewritten.photo = canonical.photo

    // Force-preserve company names and dates
    for (let i = 0; i < rewritten.experience.length && i < canonical.experience.length; i++) {
        rewritten.experience[i].company = canonical.experience[i].company
        rewritten.experience[i].startDate = canonical.experience[i].startDate
        rewritten.experience[i].endDate = canonical.experience[i].endDate
        rewritten.experience[i].role = canonical.experience[i].role
    }

    // Ensure arrays
    if (!rewritten.projects) rewritten.projects = canonical.projects || []
    if (!rewritten.skills) rewritten.skills = canonical.skills
    if (!rewritten.experience) rewritten.experience = canonical.experience

    return rewritten
}

// ── Cover Letter Generation (Pro) ────────────────────────────────────

export async function generateCoverLetter(
    optimizedResume: CanonicalResume,
    jobSpec: JobSpec,
    jobText: string
): Promise<string> {
    const companyName = (jobSpec.companyName || '').trim()
    const location = (jobSpec.location || '').trim()
    const hasCompanyInfo = companyName.length > 0

    const prompt = `You are a professional Cover Letter Writer.

TASK: Write a concise, compelling cover letter (200-320 words exactly) based on the candidate's resume and the target job.

CANDIDATE:
Name: ${optimizedResume.contact?.name || 'Candidate'}
Summary: ${optimizedResume.summary}
Key Experience: ${optimizedResume.experience.slice(0, 2).map(e => `${e.role} at ${e.company}`).join(', ')}
Top Skills: ${optimizedResume.skills.slice(0, 8).join(', ')}

TARGET JOB:
Title: ${jobSpec.title}
Must-have: ${jobSpec.mustHaveSkills.join(', ')}
Responsibilities: ${jobSpec.responsibilities.slice(0, 4).join('; ')}
Company: ${companyName || 'the company'}
Location: ${location || 'not specified'}

${hasCompanyInfo ? `JOB POSTING EXCERPT (for company context):\n${jobText.substring(0, 1500)}` : ''}

=== STRUCTURE (follow exactly) ===
1. Hook (1 sentence): role alignment and immediate fit
2. Proof Point 1: one evidence-backed achievement mapped to a must-have requirement
3. Proof Point 2: another evidence-backed achievement mapped to a different requirement
4. ${hasCompanyInfo ? 'Why this company: 1-2 sentences specific to THIS company using only available JD context.' : 'Why this role/domain: 1-2 sentences on why this role/domain is compelling.'}
5. Professional close: 1-2 sentences, specific and concise

=== RULES ===
1. LENGTH: 200-320 words. Do not exceed 320 words.
2. Professional, confident tone — not sycophantic
3. PERSONALIZATION: Use available job details naturally (Company: ${companyName || 'the company'}, Role: ${jobSpec.title}, Location: ${location || 'if applicable'})
4. Every claim must be backed by evidence from the resume. Do NOT invent achievements.
5. WHY COMPANY RULE: ${hasCompanyInfo ? 'Explain why this exact company based on provided context.' : 'Do not invent company details; focus on role/domain motivation.'}
6. NEVER use generic phrases like "Your company is a leader in..."
7. Do NOT use placeholders like "[Your Name]" or "[Company Name]"
8. Output as plain text (no markdown headers or formatting)
9. Start with "Dear Hiring Manager," unless a hiring manager name is available`

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
        },
    })

    const coverLetter = result.response.text()
    if (!coverLetter) throw new Error('Empty response from cover letter generator')

    return coverLetter.trim()
}
