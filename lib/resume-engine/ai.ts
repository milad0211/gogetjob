// ======================================================================
// AI Engine v2 — Structured Resume Rewriting
// 1. analyzeGap() — generates evidence-based Gap Report
// 2. rewriteResume() — rewrites on CanonicalJSON with strict rules
// 3. generateCoverLetter() — pro feature with structured context
// ======================================================================

import { geminiModel } from '@/lib/gemini'
import type { CanonicalResume, EvidenceMap, JobSpec, GapReport } from './types'
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
    gapReport: GapReport,
    evidenceMap: EvidenceMap
): Promise<CanonicalResume> {
    const powerVerbsList = POWER_VERBS.slice(0, 40).join(', ')
    type RewritePatch = {
        summary?: string
        skills?: string[]
        experienceBullets?: Array<{ index: number; bullets: string[] }>
        projectDescriptions?: Array<{ index: number; description: string }>
    }

    const prompt = `You are an Expert ATS Resume Writer.

TASK: Return a PATCH only. Do not regenerate the full resume JSON.

=== CANDIDATE DATA (FACTS — DO NOT CHANGE) ===
Contact: ${JSON.stringify(canonical.contact)}
Summary: ${canonical.summary}
Experience (preserve ALL role/company/dates exactly):
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
Matched keywords: ${gapReport.matchedKeywords.map(item => item.keyword).join(', ')}
Recommendations (only when evidence-backed): ${gapReport.recommendations.join('; ')}

=== EVIDENCE LOCK (MANDATORY) ===
Allowed skills only: ${evidenceMap.skills.join(', ')}
Allowed experience entities (role/company/dates only):
${JSON.stringify(evidenceMap.entities.experiences, null, 2)}
Allowed education entities (degree/school/date only):
${JSON.stringify(evidenceMap.entities.education, null, 2)}
Allowed projects only:
${JSON.stringify(evidenceMap.projects, null, 2)}
Allowed links:
${JSON.stringify(evidenceMap.links)}
Allowed metrics/numbers:
${JSON.stringify(evidenceMap.metrics)}

=== REWRITE RULES (MANDATORY) ===
1. NEVER invent companies, roles, dates, degrees, or schools
2. NEVER add skills the candidate doesn't have evidence for
3. Rewrite ONLY: summary, bullets, project descriptions, and skill ordering/grouping
4. BULLET FORMAT is mandatory for every bullet:
   Action Verb + Scope/Context + Tool/Technology + Outcome
5. Each bullet: max ${BULLET_RULES.MAX_WORDS_PER_BULLET} words
6. Each role must keep at least original bullet count and stay within ${BULLET_RULES.MIN_BULLETS_PER_ROLE}-${BULLET_RULES.MAX_BULLETS_PER_ROLE}
7. VERB DIVERSITY: no power verb may appear more than ${BULLET_RULES.MAX_VERB_REPETITIONS} times across ALL bullets.
   Use diverse verbs such as: Implemented, Developed, Refactored, Integrated, Optimized, Designed, Built, Architected, Delivered, Collaborated.
   You may also use this list: ${powerVerbsList}
8. Summary: 3-4 sentences, position candidate for THIS specific job, include only evidence-backed must-have keywords
9. Skills: reorder only; output must be subset of allowed skills
10. Use EXACT PHRASES from the JD where naturally applicable (e.g., "${jobSpec.exactPhrases.slice(0, 3).join('", "')}")
11. OUTCOME RULES:
   - You MAY only use metrics that exist in Allowed metrics/numbers
   - If no metric fits a bullet, use qualitative outcomes only
   - NEVER invent numeric outcomes like "increased by 40%" unless metric exists in allowed list
12. Prioritize must-have keywords in the first 1-2 bullets of the most relevant experience
13. ANTI-HALLUCINATION (CRITICAL):
   - company, startDate, endDate, role fields must be copied VERBATIM from original JSON
   - school and degree fields must be copied VERBATIM from original JSON
   - NEVER output "Unknown", "N/A", "TBD", or "-"
   - If you don't know a value, output "" (empty string)
14. NEVER remove project links. If rewriting a project description, keep every URL from the original description.

=== OUTPUT FORMAT ===
Return ONLY valid JSON patch with this shape:
{
    "summary": "rewritten summary",
    "skills": ["reordered evidence-backed skills only"],
    "experienceBullets": [{ "index": 0, "bullets": ["rewritten bullet"] }],
    "projectDescriptions": [{ "index": 0, "description": "rewritten description" }]
}`

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
        },
    })

    const responseText = result.response.text()
    if (!responseText) throw new Error('Empty response from AI rewriter')

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const patch = JSON.parse(cleanJson) as RewritePatch
    const rewritten: CanonicalResume = {
        ...canonical,
        summary: canonical.summary,
        experience: canonical.experience.map((exp) => ({ ...exp, bullets: [...exp.bullets] })),
        projects: canonical.projects.map((project) => ({ ...project })),
        skills: [...canonical.skills],
        portfolioLinks: [...(canonical.portfolioLinks || [])],
    }

    if (patch.summary && patch.summary.trim().length > 20) {
        rewritten.summary = patch.summary.trim()
    }

    if (Array.isArray(patch.experienceBullets)) {
        for (const item of patch.experienceBullets) {
            if (!item || typeof item.index !== 'number' || item.index < 0 || item.index >= rewritten.experience.length) continue
            const originalBullets = canonical.experience[item.index]?.bullets || []
            const nextBullets = Array.isArray(item.bullets)
                ? item.bullets.map((bullet) => bullet.trim()).filter(Boolean)
                : []
            const minBullets = Math.max(BULLET_RULES.MIN_BULLETS_PER_ROLE, Math.ceil(originalBullets.length * 0.9))
            rewritten.experience[item.index].bullets = nextBullets.length >= minBullets ? nextBullets : originalBullets
        }
    }

    if (Array.isArray(patch.projectDescriptions)) {
        for (const item of patch.projectDescriptions) {
            if (!item || typeof item.index !== 'number' || item.index < 0 || item.index >= rewritten.projects.length) continue
            const originalDescription = canonical.projects[item.index]?.description || ''
            const originalUrls = originalDescription.match(/\bhttps?:\/\/[^\s)]+/gi) || []
            const proposed = (item.description || '').trim()
            if (!proposed) continue
            const withLinks = originalUrls.reduce((acc, url) => (acc.includes(url) ? acc : `${acc} ${url}`.trim()), proposed)
            rewritten.projects[item.index].description = withLinks
        }
    }

    // Skills lock: only keep skills with evidence
    const allowedSkills = new Set(evidenceMap.skills.map((skill) => skill.toLowerCase().trim()).filter(Boolean))
    const filteredSkills = (patch.skills || rewritten.skills || [])
        .map((skill) => skill.trim())
        .filter((skill) => skill && allowedSkills.has(skill.toLowerCase()))
    rewritten.skills = filteredSkills.length > 0 ? Array.from(new Set(filteredSkills)) : canonical.skills

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
