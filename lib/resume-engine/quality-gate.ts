import type { CanonicalResume, EvidenceMap } from './types'

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

function unique(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function collectLinks(text: string): Set<string> {
    const links = text.match(/\bhttps?:\/\/[^\s)]+/gi) || []
    return new Set(links.map((link) => link.trim()))
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

    if (rewritten.experience.length !== original.experience.length) {
        issues.push('Experience entry count changed from original')
    }

    if (rewritten.projects.length !== original.projects.length) {
        issues.push('Project entry count changed from original')
    }

    if (rewritten.education.length !== original.education.length) {
        issues.push('Education entry count changed from original')
    }

    const n = rewritten.experience.length

    for (let i = 0; i < n; i += 1) {
        const rw = rewritten.experience[i]
        const og = original.experience[i]
        if (!rw || !og) {
            issues.push(`Experience[${i}] is missing or extra`)
            continue
        }

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

    const e = rewritten.education.length
    for (let i = 0; i < e; i += 1) {
        const rw = rewritten.education[i]
        const og = original.education[i]
        if (!rw || !og) {
            issues.push(`Education[${i}] is missing or extra`)
            continue
        }
        if (normalize(rw.school) !== normalize(og.school)) {
            issues.push(`Education[${i}] school changed from original`)
        }
        if (normalize(rw.degree) !== normalize(og.degree)) {
            issues.push(`Education[${i}] degree changed from original`)
        }
    }

    return issues
}

function detectSkillInjection(rewritten: CanonicalResume, evidenceMap: EvidenceMap): string[] {
    const allowed = new Set(evidenceMap.skills.map((skill) => normalize(skill)).filter(Boolean))
    const rewrittenSkills = unique(rewritten.skills || [])
    const injected = rewrittenSkills.filter((skill) => !allowed.has(normalize(skill)))
    return injected.map((skill) => `Injected skill not in evidence map: ${skill}`)
}

function verifyLinkPreservation(rewritten: CanonicalResume, evidenceMap: EvidenceMap): string[] {
    const issues: string[] = []
    const requiredLinks = new Set(unique(evidenceMap.links || []))
    if (requiredLinks.size === 0) return issues

    const rewrittenCorpus = [
        rewritten.contact.linkedin || '',
        rewritten.summary,
        ...(rewritten.portfolioLinks || []),
        ...rewritten.experience.flatMap((exp) => [exp.role, exp.company, ...exp.bullets]),
        ...rewritten.projects.flatMap((project) => [project.name, project.description, project.url || '']),
    ].join(' ')
    const existingLinks = collectLinks(rewrittenCorpus)

    for (const link of requiredLinks) {
        if (!existingLinks.has(link)) {
            issues.push(`Required evidence link missing in output: ${link}`)
        }
    }

    return issues
}

function countWords(value: string): number {
    return value.trim().split(/\s+/).filter(Boolean).length
}

function checkContentVolume(rewritten: CanonicalResume, original: CanonicalResume): string[] {
    const issues: string[] = []
    const originalCorpus = [
        ...original.experience.flatMap((exp) => exp.bullets),
        ...original.projects.flatMap((project) => [project.description]),
    ].join(' ')
    const rewrittenCorpus = [
        ...rewritten.experience.flatMap((exp) => exp.bullets),
        ...rewritten.projects.flatMap((project) => [project.description]),
    ].join(' ')

    const originalWords = countWords(originalCorpus)
    const rewrittenWords = countWords(rewrittenCorpus)
    if (originalWords > 0 && rewrittenWords / originalWords < 0.65) {
        issues.push('Output is over-compressed: experience/projects content volume dropped too much')
    }

    return issues
}

function checkSectionPreservation(rewritten: CanonicalResume, original: CanonicalResume): string[] {
    const issues: string[] = []
    const totalSections = original.experience.length + original.projects.length + 1 // +1 for links section
    if (totalSections <= 0) return issues

    let preserved = 0
    for (let i = 0; i < original.experience.length; i += 1) {
        const originalEntry = original.experience[i]
        const rewrittenEntry = rewritten.experience[i]
        if (!originalEntry) continue
        if (rewrittenEntry && rewrittenEntry.bullets.length > 0) preserved += 1
    }
    for (let i = 0; i < original.projects.length; i += 1) {
        const originalProject = original.projects[i]
        const rewrittenProject = rewritten.projects[i]
        if (!originalProject) continue
        if (rewrittenProject && (rewrittenProject.description || rewrittenProject.url)) preserved += 1
    }

    const originalLinks = collectLinks([
        original.contact.linkedin || '',
        ...(original.portfolioLinks || []),
        ...original.projects.flatMap((project) => [project.description, project.url || '']),
    ].join(' '))
    const rewrittenLinks = collectLinks([
        rewritten.contact.linkedin || '',
        ...(rewritten.portfolioLinks || []),
        ...rewritten.projects.flatMap((project) => [project.description, project.url || '']),
    ].join(' '))
    if (originalLinks.size === 0 || Array.from(originalLinks).every((link) => rewrittenLinks.has(link))) {
        preserved += 1
    }

    const ratio = preserved / totalSections
    if (ratio < 0.9) {
        issues.push(`Critical section preservation below threshold: ${(ratio * 100).toFixed(1)}%`)
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
    evidencePool: string[],
    evidenceMap: EvidenceMap
): QualityGateResult {
    const criticalIssues = [
        ...hasCriticalMissingFacts(rewritten),
        ...compareFactPreservation(rewritten, original),
        ...detectSkillInjection(rewritten, evidenceMap),
        ...verifyLinkPreservation(rewritten, evidenceMap),
        ...checkSectionPreservation(rewritten, original),
        ...checkContentVolume(rewritten, original),
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
