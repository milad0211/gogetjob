// ======================================================================
// AI Engine v3 — Strategic Resume Rewriting
// 1. analyzeGap() — gap analysis with transferable skill mapping
// 2. rewriteResume() — evidence-locked rewrite with career transition awareness
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

    const prompt = `You are a Resume-to-Job gap analyzer specializing in career transition analysis.

TASK: Compare the candidate's resume against the job requirements. Identify matches, gaps, AND transferable skills.

CANDIDATE SKILLS: ${resumeSkills}

CANDIDATE EXPERIENCE BULLETS:
${resumeBullets.substring(0, 5000)}

CANDIDATE PROJECTS:
${projectsText.substring(0, 2000)}

CANDIDATE CERTIFICATIONS: ${canonical.certifications?.join(', ') || 'none'}

JOB REQUIREMENTS:
- Title: ${jobSpec.title}
- Seniority: ${jobSpec.seniorityLevel}
- Must-have: ${jobSpec.mustHaveSkills.join(', ')}
- Nice-to-have: ${jobSpec.niceToHaveSkills.join(', ')}
- Soft skills: ${jobSpec.softSkills.join(', ')}
- Key phrases: ${jobSpec.exactPhrases.join(', ')}
- Responsibilities: ${jobSpec.responsibilities.join('; ')}

OUTPUT: Return ONLY valid JSON:
{
    "matchedKeywords": [
        { "keyword": "React", "foundIn": ["skills", "experience"] }
    ],
    "missingKeywords": ["keyword1", "keyword2"],
    "transferableSkills": [
        { "has": "Spring Boot", "mapsTo": "Node.js backend", "strength": "strong" },
        { "has": "JUnit testing", "mapsTo": "Jest testing", "strength": "moderate" }
    ],
    "recommendations": [
        "Emphasize JavaScript fundamentals from Project X",
        "Bridge Java OOP experience to JavaScript patterns"
    ]
}

RULES:
1. matchedKeywords.foundIn: "skills", "experience", "projects", "summary", "certifications"
2. missingKeywords = JD skills with NO evidence, NO transferable mapping
3. transferableSkills = candidate skills that MAP to missing JD skills:
   - "strong": Same category (e.g. Java → JavaScript, React → Vue.js)
   - "moderate": Related domain (e.g. REST API design → GraphQL, SQL → NoSQL)
   - "weak": General competency (e.g. backend dev → frontend understanding)
4. recommendations = specific, actionable rewrite suggestions showing HOW to bridge gaps
5. Consider the seniority level: for ${jobSpec.seniorityLevel}-level roles, adjust expectations accordingly`

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.15,
        },
    })

    const responseText = result.response.text()
    if (!responseText) throw new Error('Empty response from gap analyzer')

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanJson) as GapReport

    if (!parsed.matchedKeywords) parsed.matchedKeywords = []
    if (!parsed.missingKeywords) parsed.missingKeywords = []
    if (!parsed.transferableSkills) parsed.transferableSkills = []
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
    const powerVerbsList = POWER_VERBS.join(', ')
    type RewritePatch = {
        summary?: string
        skills?: string[]
        experienceBullets?: Array<{ index: number; bullets: string[] }>
        projectDescriptions?: Array<{ index: number; description: string }>
        certifications?: string[]
        keyAchievements?: string[]
    }

    const transferableContext = gapReport.transferableSkills?.length > 0
        ? `\nTRANSFERABLE SKILL MAPPINGS (use these to bridge gaps naturally):
${gapReport.transferableSkills.map(t => `- "${t.has}" → "${t.mapsTo}" (${t.strength})`).join('\n')}`
        : ''

    const prompt = `You are a world-class ATS Resume Optimization Expert with 10+ years of HR and recruiting experience.

YOUR GOAL: Transform this resume to maximally align with the target job while preserving 100% factual integrity.
The candidate's background may differ from the target role. Your job is to BRIDGE the gap using transferable skills and evidence-backed rephrasing.

=== CANDIDATE DATA (IMMUTABLE FACTS — NEVER CHANGE) ===
Contact: ${JSON.stringify(canonical.contact)}

Original Summary: ${canonical.summary}

Experience (preserve ALL role/company/dates VERBATIM):
${JSON.stringify(canonical.experience, null, 2)}

Projects:
${JSON.stringify(canonical.projects || [], null, 2)}

Skills (original): ${canonical.skills.join(', ')}

Education (preserve VERBATIM): ${JSON.stringify(canonical.education)}

Certifications (preserve ALL): ${canonical.certifications?.join(', ') || 'none'}

Key Achievements (preserve ALL): ${canonical.keyAchievements?.join(', ') || 'none'}

Languages (preserve ALL verbatim): ${canonical.languages?.length ? canonical.languages.map(l => `${l.language} (${l.proficiency})`).join(', ') : 'none'}

Additional Sections (preserve ALL verbatim):
${canonical.additionalSections?.length ? canonical.additionalSections.map(s => `[${s.title}]: ${s.items.join('; ')}`).join('\n') : 'none'}

=== TARGET JOB ===
Title: ${jobSpec.title}
Seniority: ${jobSpec.seniorityLevel}
Company: ${jobSpec.companyName || 'Not specified'}
Must-have skills: ${jobSpec.mustHaveSkills.join(', ')}
Nice-to-have: ${jobSpec.niceToHaveSkills.join(', ')}
Soft skills valued: ${jobSpec.softSkills.join(', ')}
Key phrases (use verbatim where natural): ${jobSpec.exactPhrases.join(', ')}
Responsibilities: ${jobSpec.responsibilities.join('; ')}
Domain terms: ${jobSpec.domainTerms.join(', ')}

=== GAP ANALYSIS ===
Matched keywords: ${gapReport.matchedKeywords.map(item => item.keyword).join(', ')}
Missing (DO NOT add these as skills): ${gapReport.missingKeywords.join(', ')}
${transferableContext}
Recommendations: ${gapReport.recommendations.join('; ')}

=== EVIDENCE LOCK (ABSOLUTE BOUNDARY — VIOLATION = FAILURE) ===
Allowed skills ONLY: ${evidenceMap.skills.join(', ')}
Allowed experience entities (role/company/dates):
${JSON.stringify(evidenceMap.entities.experiences, null, 2)}
Allowed education entities:
${JSON.stringify(evidenceMap.entities.education, null, 2)}
Allowed projects:
${JSON.stringify(evidenceMap.projects, null, 2)}
Allowed links: ${JSON.stringify(evidenceMap.links)}
Allowed metrics/numbers: ${JSON.stringify(evidenceMap.metrics)}

=== STRATEGIC REWRITE RULES ===

**SUMMARY (3-4 sentences, CRITICAL for first impression):**
1. OPENER: Position candidate for THIS specific role using evidence-backed title alignment
   - If candidate has strong evidence for target domain → use JD title language
   - If career transition → bridge with transferable domain language (e.g. "Experienced [Current Domain] professional with strong [Transferable Skill] seeking to leverage expertise in [Target Domain]")
   - ⚠️ NEVER claim direct experience in a domain the candidate has NOT worked in. Use "seeking to contribute" or "ready to apply" instead of "proven track record in [new domain]"
2. STRENGTHS: Mention top 2-3 transferable skills that directly map to JD must-haves, WITH evidence
3. BRIDGE: One sentence connecting candidate's proven competencies to target role requirements. Use "positioned to" or "eager to apply" — NOT "experienced in" for skills they don't have
4. VALUE: Concrete value proposition based on real achievements from their ACTUAL experience
5. SENIORITY CALIBRATION: For ${jobSpec.seniorityLevel}-level roles, calibrate language accordingly:
   - Entry: emphasize learning agility, foundational skills, eagerness, relevant coursework/projects
   - Mid: emphasize proven track record, specific technical depth
   - Senior: emphasize leadership, architecture decisions, business impact
6. ⚠️ SUMMARY ANTI-HALLUCINATION: If the JD mentions a domain (e.g. AI, blockchain, healthcare) that the candidate has NO evidence of working in:
   - ❌ WRONG: "Proven track record in AI model development"
   - ✅ RIGHT: "Experienced Sales Leader eager to apply deep B2B expertise to AI-driven sales optimization"
   - The summary must NEVER claim experience the candidate does not have
7. ⚠️ NEVER use the candidate's name or third-person pronouns (he/she/they) in the summary. Resumes are written IMPERSONALLY:
   - ❌ WRONG: "Amelia is positioned to navigate..." or "She has 5 years..."
   - ✅ RIGHT: "Senior Technology Project Manager with 3 years of experience..." (no name, no pronouns)
8. WRITE LIKE A HUMAN, NOT AN AI. Avoid these AI cliché phrases:
   - ❌ BANNED: "navigate the dynamic landscape", "pivotal", "honed", "uniquely positioned", "passion for", "cutting-edge", "holistic approach", "leverage synergies", "drive innovation", "in today's fast-paced"
   - ✅ USE: Direct, concrete language. "Managed" not "orchestrated". "Improved" not "spearheaded the optimization of".
   - Do NOT copy sentences verbatim from the job description. Rephrase them in the candidate's own voice.

**BULLET REWRITING (most important for ATS + recruiter scanning):**
1. FORMULA: Action Verb + Scope/Context + Tool/Technology + Outcome
2. RELEVANCE TIERING — rewrite bullets in order of importance:
   - Tier 1 (HIGHEST): Bullets where candidate used skills matching JD must-haves → rewrite using exact JD phrasing
   - Tier 2: Bullets showing transferable competencies → bridge language (e.g. "Built RESTful APIs using Spring Boot" → "Built RESTful APIs demonstrating backend architecture skills applicable to Node.js environments")
   - Tier 3: General professional competencies → polish for clarity and impact
3. FRONT-LOAD: Place the most JD-relevant bullets FIRST in each experience entry
4. Each bullet: max ${BULLET_RULES.MAX_WORDS_PER_BULLET} words
5. Min ${BULLET_RULES.MIN_BULLETS_PER_ROLE} bullets per role, max ${BULLET_RULES.MAX_BULLETS_PER_ROLE}
6. VERB DIVERSITY: Use diverse verbs from this list. No verb may repeat more than ${BULLET_RULES.MAX_VERB_REPETITIONS} times across ALL bullets:
   ${powerVerbsList}

**SKILLS SECTION:**
1. REORDER by JD priority: must-have matches first → nice-to-have matches → remaining
2. GROUP by category: Languages → Frameworks → Tools → Methodologies → Soft Skills
3. Output must be a SUBSET of allowed skills only — NEVER add skills not in evidence
4. Keep ALL evidence-backed skills. Do not drop relevant ones.

**ANTI-HALLUCINATION (CRITICAL — VIOLATION WILL FAIL QUALITY GATE):**
1. NEVER invent companies, roles, dates, degrees, or schools
2. NEVER add skills not in the evidence pool
3. NEVER invent metrics (e.g. "improved by 40%") — use ONLY numbers from allowed metrics
4. If no metric fits, use qualitative outcomes: "Improved efficiency", "Enhanced reliability"
5. company, role, startDate, endDate → copy VERBATIM from original
6. school, degree, date → copy VERBATIM from original
7. NEVER output "Unknown", "N/A", "TBD", or "—"
8. If a value is unknown, output "" (empty string)
9. NEVER remove project links — preserve every URL from originals
10. Use EXACT JD PHRASES where they naturally fit (e.g. "${jobSpec.exactPhrases.slice(0, 3).join('", "')}")
11. NEVER claim experience in domains (AI, ML, blockchain, etc.) the candidate has NOT worked in. The summary and bullets must only reference domains evidenced in the original resume.
12. PRESERVE ALL certifications and key achievements — they are critical for credibility

**CERTIFICATIONS & ACHIEVEMENTS:**
1. Copy ALL certifications VERBATIM from original — never remove or modify them
2. Copy ALL key achievements VERBATIM from original — never remove or modify them
3. Copy ALL languages VERBATIM from original — never remove or modify them
4. Copy ALL additional sections VERBATIM from original — never remove or modify them
5. These sections are READ-ONLY. Output them unchanged.

=== OUTPUT FORMAT ===
Return ONLY valid JSON with this shape:
{
    "summary": "rewritten summary following the strategic framework above",
    "skills": ["reordered evidence-backed skills only"],
    "experienceBullets": [{ "index": 0, "bullets": ["rewritten bullet 1", "rewritten bullet 2"] }],
    "projectDescriptions": [{ "index": 0, "description": "rewritten description" }],
    "certifications": ["ALL original certifications, copied verbatim"],
    "keyAchievements": ["ALL original achievements, copied verbatim"]
}`

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.15,
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
        certifications: [...(canonical.certifications || [])],
        keyAchievements: [...(canonical.keyAchievements || [])],
        languages: [...(canonical.languages || [])],
        additionalSections: (canonical.additionalSections || []).map(s => ({ ...s, items: [...s.items] })),
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

    // Skills lock: only keep skills with evidence (case-insensitive)
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
Seniority: ${jobSpec.seniorityLevel}
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
3. WRITE ENTIRELY IN FIRST PERSON ("I", "my", "me"). NEVER use third person ("he", "she", "${optimizedResume.contact?.name}"). This is a cover letter written BY the candidate.
4. PERSONALIZATION: Use available job details naturally (Company: ${companyName || 'the company'}, Role: ${jobSpec.title}, Location: ${location || 'if applicable'})
5. Every claim must be backed by evidence from the resume. Do NOT invent achievements.
6. NEVER claim direct experience in a domain the candidate hasn't worked in. Use "eager to apply", "positioned to contribute" for new domains.
7. WHY COMPANY RULE: ${hasCompanyInfo ? 'Explain why this exact company based on provided context.' : 'Do not invent company details; focus on role/domain motivation.'}
8. NEVER use generic phrases like "Your company is a leader in..."
9. NEVER use placeholder text like "Target Role", "the position", "[Your Name]", or "[Company Name]". Always use the ACTUAL job title "${jobSpec.title}" and company name "${companyName || 'your team'}".
10. Output as plain text (no markdown headers or formatting)
11. Start with "Dear Hiring Manager," unless a hiring manager name is available
12. End with "Sincerely," followed by the candidate's name: ${optimizedResume.contact?.name || 'Candidate'}
13. NEVER mention skills/tools the candidate has NOT used (e.g. if resume doesn't mention "Go" or "Gin", do not mention them)
14. The role title is "${jobSpec.title}". NEVER use a JD responsibility sentence as the role title. 
   - ❌ WRONG: "...for the Lead and support project team members to ensure successful project execution. role"
   - ✅ RIGHT: "...for the ${jobSpec.title} role at ${companyName || 'your organization'}"
15. WRITE LIKE A HUMAN. Avoid robotic AI language:
   - ❌ BANNED: "pivotal", "honed", "uniquely positioned", "navigate the dynamic landscape", "passion for driving", "holistic", "cutting-edge"
   - ✅ USE: Natural, direct language. Read it aloud — if it sounds like a chatbot wrote it, rewrite it.
   - Do NOT copy sentences verbatim from the JD. Rephrase in the candidate's own voice.`

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
