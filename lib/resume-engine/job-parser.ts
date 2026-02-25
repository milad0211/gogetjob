import { geminiModel } from '@/lib/gemini'
import type { JobSpec } from './types'

const COMMON_SKILLS = [
    // Web Frontend
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
    'HTML', 'CSS', 'Sass', 'SCSS', 'Tailwind', 'Bootstrap', 'Material UI',
    'Redux', 'Zustand', 'MobX', 'Webpack', 'Vite', 'Babel', 'jQuery',
    // Backend & Server
    'Node.js', 'Express', 'NestJS', 'Fastify', 'Deno', 'Bun',
    'Python', 'Django', 'Flask', 'FastAPI',
    'Java', 'Spring', 'Spring Boot', 'Hibernate', 'Maven', 'Gradle',
    'C#', '.NET', 'ASP.NET',
    'Go', 'Gin', 'Fiber',
    'Ruby', 'Rails', 'PHP', 'Laravel',
    'Rust', 'Elixir', 'Scala', 'Clojure',
    // Mobile
    'Swift', 'SwiftUI', 'Objective-C', 'iOS',
    'Kotlin', 'Android', 'Jetpack Compose', 'React Native', 'Flutter', 'Dart',
    'Xamarin', 'Ionic', 'Capacitor',
    // Data & DB
    'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis',
    'Elasticsearch', 'DynamoDB', 'Cassandra', 'Firebase', 'Supabase',
    'Prisma', 'TypeORM', 'Sequelize', 'Mongoose',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
    'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI',
    'Nginx', 'Apache', 'Linux', 'Bash', 'Shell',
    'Vercel', 'Netlify', 'Heroku', 'DigitalOcean',
    // APIs & Architecture
    'GraphQL', 'REST', 'RESTful', 'gRPC', 'WebSocket',
    'Microservices', 'Serverless', 'Event-Driven',
    'OAuth', 'JWT', 'SSO', 'SAML',
    // Testing & QA
    'Testing', 'Jest', 'Cypress', 'Playwright', 'Selenium',
    'Mocha', 'Chai', 'Vitest', 'Puppeteer',
    'Unit Testing', 'Integration Testing', 'E2E Testing', 'TDD', 'BDD',
    // Data Science & AI
    'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
    'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy',
    'Data Analysis', 'Data Engineering', 'ETL', 'Apache Spark', 'Kafka',
    'Power BI', 'Tableau', 'Jupyter',
    // Tools & Practices
    'Git', 'GitHub', 'GitLab', 'Bitbucket',
    'Jira', 'Confluence', 'Trello', 'Notion',
    'Agile', 'Scrum', 'Kanban', 'SAFe',
    'Figma', 'Sketch', 'Adobe XD',
    'SaaS', 'PaaS', 'IaaS',
    'Slack', 'Microsoft Teams', 'Zoom',
    // Fundamentals
    'OOP', 'Functional Programming', 'Design Patterns', 'SOLID',
    'Data Structures', 'Algorithms', 'System Design',
    'DOM', 'DOM Manipulation', 'ES6', 'ES6+',
    'Asynchronous Programming', 'Async/Await', 'Promises',
    'Version Control', 'Code Review', 'Pair Programming',
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
        /\b(engineer|developer|manager|designer|analyst|architect|scientist|consultant|specialist|administrator|coordinator|lead|director|intern|associate|technician|programmer)\b/i.test(line) &&
        line.length < 100
    )
    return roleLike || 'Target Role'
}

function extractCompany(lines: string[]): string {
    const byLabel = lines.find((line) => /^company\s*:/i.test(line))
    if (byLabel) return byLabel.replace(/^company\s*:/i, '').trim()

    const joinPattern = lines.find((line) => /\b(join|join us at|work at|work for)\s+[A-Z]/i.test(line))
    if (joinPattern) {
        const match = joinPattern.match(/\b(?:join|join us at|work at|work for)\s+([A-Z][A-Za-z0-9& .-]{1,60})/i)
        if (match?.[1]) return match[1].trim()
    }

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

    const locationLine = lines.find((line) => /\b(remote|hybrid|onsite|on-site|work from home|work from anywhere)\b/i.test(line))
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

function detectSeniority(text: string): string {
    const lower = text.toLowerCase()
    if (/\b(senior|sr\.?|staff|principal|lead|architect)\b/i.test(lower)) return 'senior'
    if (/\b(mid[- ]?level|intermediate|2[- ]?4\s*years|3[- ]?5\s*years)\b/i.test(lower)) return 'mid'
    if (/\b(entry[- ]?level|junior|jr\.?|intern|new grad|graduate|beginner|0[- ]?2\s*years|no experience required)\b/i.test(lower)) return 'entry'
    return 'mid'
}

function heuristicParseJobDescription(jobText: string): JobSpec {
    const normalized = normalizeText(jobText)
    const lines = splitLines(normalized)
    const title = extractTitle(lines)
    const companyName = extractCompany(lines)
    const location = extractLocation(lines)
    const responsibilities = extractResponsibilityLines(lines)
    const allSkills = extractSkillsFromText(normalized)
    const seniorityLevel = detectSeniority(normalized)

    const mustHaveSkills = allSkills.slice(0, 10)
    const niceToHaveSkills = allSkills.slice(10, 20)
    const exactPhrases = extractPhrases(lines)
    const domainTerms = unique(
        ['agile', 'stakeholder', 'scalable', 'performance', 'architecture', 'product',
            'e-commerce', 'fintech', 'healthcare', 'saas', 'startup', 'enterprise']
            .filter((term) => normalized.toLowerCase().includes(term))
    )

    return {
        title,
        companyName,
        location,
        seniorityLevel,
        mustHaveSkills,
        niceToHaveSkills,
        softSkills: [],
        exactPhrases,
        responsibilities,
        domainTerms,
    }
}

async function aiParseJobDescription(jobText: string): Promise<JobSpec> {
    const prompt = `You are an expert Job Description Analyzer for a resume optimization system.

TASK: Parse this job description into structured JSON for resume targeting.

RULES:
1. Extract the EXACT job title as written
2. Separate technical/hard skills from soft skills
3. Identify seniority level from context clues (entry/mid/senior)
4. Extract key phrases that should appear verbatim in a resume
5. Identify domain-specific terminology
6. Be thorough — missing a must-have skill means the resume won't match

Return ONLY valid JSON with this shape:
{
  "title": "exact job title",
  "companyName": "company name or empty string",
  "location": "location/remote or empty string",
  "seniorityLevel": "entry|mid|senior",
  "mustHaveSkills": ["technical skills explicitly required"],
  "niceToHaveSkills": ["skills mentioned as preferred/bonus"],
  "softSkills": ["communication, leadership, teamwork, etc."],
  "exactPhrases": ["key phrases from JD to use verbatim in resume"],
  "responsibilities": ["main job duties"],
  "domainTerms": ["industry/domain specific terms"]
}

IMPORTANT:
- mustHaveSkills = skills in Requirements or "must have" sections
- niceToHaveSkills = skills with "preferred", "plus", "bonus", "nice to have"
- exactPhrases = distinctive phrases from JD that would signal alignment (e.g. "dynamic web applications", "collaborative remote teamwork")
- For entry-level roles, include foundational skills like "HTML", "CSS", "JavaScript" even if seemingly basic

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
        seniorityLevel: parsed.seniorityLevel || fallback.seniorityLevel,
        mustHaveSkills: unique(parsed.mustHaveSkills || fallback.mustHaveSkills),
        niceToHaveSkills: unique(parsed.niceToHaveSkills || fallback.niceToHaveSkills),
        softSkills: unique(parsed.softSkills || []),
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
