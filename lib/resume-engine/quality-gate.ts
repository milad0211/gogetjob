import type { CanonicalResume } from './types'

export interface QualityGateResult {
    passed: boolean
    status: 'passed' | 'warning' | 'failed'
    issues: string[]
}

function normalize(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function collectNumbers(text: string): Set<string> {
    const matches = text.match(/\b\d+(\.\d+)?%?\b/g) || []
    return new Set(matches)
}

function hasCriticalMissingFacts(resume: CanonicalResume): string[] {
    const issues: string[] = []
    if (!resume.contact.name) issues.push('Missing contact name')
    if (resume.experience.length === 0) issues.push('No experience entries')
    if (resume.education.length === 0) issues.push('No education entries')
    return issues
}

function compareFactPreservation(rewritten: CanonicalResume, original: CanonicalResume): string[] {
    const issues: string[] = []
    const n = Math.min(rewritten.experience.length, original.experience.length)

    for (let i = 0; i < n; i += 1) {
        const rw = rewritten.experience[i]
        const og = original.experience[i]

        if (normalize(rw.company) !== normalize(og.company)) {
            issues.push(`Experience[${i}] company changed from original`)
        }
        if (normalize(rw.startDate) !== normalize(og.startDate)) {
            issues.push(`Experience[${i}] start date changed from original`)
        }
        if (normalize(rw.endDate) !== normalize(og.endDate)) {
            issues.push(`Experience[${i}] end date changed from original`)
        }
        if (normalize(rw.role) !== normalize(og.role)) {
            issues.push(`Experience[${i}] role changed from original`)
        }
    }

    const e = Math.min(rewritten.education.length, original.education.length)
    for (let i = 0; i < e; i += 1) {
        const rw = rewritten.education[i]
        const og = original.education[i]
        if (normalize(rw.school) !== normalize(og.school)) {
            issues.push(`Education[${i}] school changed from original`)
        }
        if (normalize(rw.degree) !== normalize(og.degree)) {
            issues.push(`Education[${i}] degree changed from original`)
        }
    }

    return issues
}

function checkBulletStructure(rewritten: CanonicalResume): string[] {
    const issues: string[] = []
    rewritten.experience.forEach((exp, index) => {
        if (exp.bullets.length < 2) {
            issues.push(`Experience[${index}] has too few bullets`)
        }
        if (exp.bullets.length > 8) {
            issues.push(`Experience[${index}] has too many bullets`)
        }
        exp.bullets.forEach((bullet, bulletIndex) => {
            const words = bullet.trim().split(/\s+/).filter(Boolean)
            if (words.length > 32) {
                issues.push(`Experience[${index}] bullet[${bulletIndex}] is too long`)
            }
        })
    })
    return issues
}

function detectUnverifiableNumbers(
    rewritten: CanonicalResume,
    original: CanonicalResume,
    evidencePool: string[]
): string[] {
    const issues: string[] = []
    const originalCorpus = [
        original.summary,
        ...original.skills,
        ...original.certifications,
        ...original.experience.flatMap((exp) => exp.bullets),
        ...evidencePool,
    ].join(' ')
    const allowedNumbers = collectNumbers(originalCorpus)

    for (const bullet of rewritten.experience.flatMap((exp) => exp.bullets)) {
        const nums = collectNumbers(bullet)
        for (const num of nums) {
            if (!allowedNumbers.has(num)) {
                issues.push(`Potentially invented metric detected: ${num}`)
            }
        }
    }

    return issues
}

export function validateOutput(
    rewritten: CanonicalResume,
    original: CanonicalResume,
    evidencePool: string[]
): QualityGateResult {
    const criticalIssues = [
        ...hasCriticalMissingFacts(rewritten),
        ...compareFactPreservation(rewritten, original),
    ]

    const warningIssues = [
        ...checkBulletStructure(rewritten),
        ...detectUnverifiableNumbers(rewritten, original, evidencePool),
    ]

    if (criticalIssues.length > 0) {
        return {
            passed: false,
            status: 'failed',
            issues: [...criticalIssues, ...warningIssues].slice(0, 20),
        }
    }

    if (warningIssues.length > 0) {
        return {
            passed: true,
            status: 'warning',
            issues: warningIssues.slice(0, 20),
        }
    }

    return {
        passed: true,
        status: 'passed',
        issues: [],
    }
}

