import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'

// ── Premium ATS-Safe Palette ──
const C = {
    navy: '#1B2A4A',
    blue: '#2B5797',
    accent: '#3A7BD5',
    text: '#2D2D2D',
    textMed: '#4A4A4A',
    textLight: '#6B6B6B',
    rule: '#2B5797',
    ruleLight: '#D1D5DB',
    white: '#FFFFFF',
    headerBg: '#F7F8FA',
    tagBg: '#EDF2F7',
}

const s = StyleSheet.create({
    page: {
        paddingTop: 32,
        paddingBottom: 36,
        paddingHorizontal: 0,
        fontFamily: 'Helvetica',
        fontSize: 9.5,
        lineHeight: 1.35,
        color: C.text,
        backgroundColor: C.white,
    },
    // ─── Premium Header ───
    headerWrap: {
        backgroundColor: C.headerBg,
        marginTop: -32,
        paddingTop: 30,
        paddingBottom: 18,
        paddingHorizontal: 40,
        borderBottomWidth: 3,
        borderBottomColor: C.navy,
        marginBottom: 16,
    },
    name: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: C.navy,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 2,
    },
    contactItem: {
        fontSize: 9,
        color: C.textMed,
    },
    contactSep: {
        fontSize: 9,
        color: C.ruleLight,
        marginHorizontal: 8,
    },
    linkText: {
        fontSize: 9,
        color: C.accent,
        textDecoration: 'none',
    },
    // ─── Body ───
    body: {
        paddingHorizontal: 40,
    },
    // ─── Sections ───
    section: {
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    sectionAccent: {
        width: 4,
        height: 14,
        backgroundColor: C.blue,
        borderRadius: 1,
    },
    sectionTitle: {
        fontSize: 10.5,
        fontFamily: 'Helvetica-Bold',
        color: C.navy,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    sectionRule: {
        flex: 1,
        height: 1,
        backgroundColor: C.ruleLight,
        marginLeft: 6,
    },
    // ─── Experience ───
    jobBlock: {
        marginBottom: 8,
    },
    jobRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 3,
    },
    jobTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 10,
        color: C.text,
    },
    jobSep: {
        fontSize: 10,
        color: C.ruleLight,
        marginHorizontal: 6,
    },
    jobCompany: {
        fontFamily: 'Helvetica-Oblique',
        fontSize: 10,
        color: C.blue,
    },
    jobMeta: {
        fontSize: 8.5,
        color: C.textLight,
        textAlign: 'right' as const,
    },
    bullet: {
        flexDirection: 'row',
        marginBottom: 2.5,
        paddingLeft: 2,
    },
    bulletDot: {
        width: 12,
        fontSize: 9,
        color: C.blue,
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        lineHeight: 1.4,
        color: C.text,
    },
    // ─── Skills ───
    skillsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    skillTag: {
        fontSize: 8.5,
        color: C.navy,
        backgroundColor: C.tagBg,
        paddingVertical: 2.5,
        paddingHorizontal: 7,
        borderRadius: 3,
    },
    // ─── Education ───
    eduBlock: {
        marginBottom: 4,
    },
    eduDegree: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9.5,
        color: C.text,
    },
    eduSchool: {
        fontSize: 9,
        color: C.blue,
    },
    eduDate: {
        fontSize: 8.5,
        color: C.textLight,
    },
    certText: {
        fontSize: 9,
        color: C.text,
        marginBottom: 1.5,
    },
    projectTech: {
        fontSize: 8,
        color: C.textLight,
        marginTop: 1,
    },
})

// ── Types ──
interface ResumeData {
    summary: string
    experience: {
        role: string
        company: string
        startDate: string
        endDate: string
        location?: string
        bullets: string[]
    }[]
    projects?: {
        name: string
        description: string
        technologies: string[]
        url?: string
    }[]
    portfolioLinks?: string[]
    skills: string[]
    education: {
        degree: string
        school: string
        date: string
    }[]
    certifications?: string[]
    keyAchievements?: string[]
    languages?: { language: string; proficiency: string }[]
    additionalSections?: { title: string; items: string[] }[]
    contact?: {
        name?: string
        email?: string
        phone?: string
        linkedin?: string
        location?: string
    }
}

// ── Section with accent bar ──
function Section({ title, children, wrap = true }: { title: string; children: React.ReactNode; wrap?: boolean }) {
    return (
        <View style={s.section} wrap={wrap}>
            <View style={s.sectionHeader} wrap={false}>
                <View style={s.sectionAccent} />
                <Text style={s.sectionTitle}>{title}</Text>
                <View style={s.sectionRule} />
            </View>
            {children}
        </View>
    )
}

function Bullet({ text }: { text: string }) {
    return (
        <View style={s.bullet} wrap={false}>
            <Text style={s.bulletDot}>▸</Text>
            <Text style={s.bulletText}>{text}</Text>
        </View>
    )
}

/** Format phone: "1 - 234 - 555 - 1234" → "+1 (234) 555-1234" */
function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    return raw // fallback: return as-is
}

// ── Main ──
export function ResumePdf({ data, mode }: { data: ResumeData; mode?: 'ats' | 'premium' }) {
    const isPremium = mode === 'premium'

    const projectLinks = (data.projects || []).flatMap((p) => {
        const links: string[] = p.description.match(/\bhttps?:\/\/[^\s)]+/gi) || []
        if (p.url) links.push(p.url)
        return links
    })
    const allLinks = Array.from(new Set([...(data.portfolioLinks || []), ...projectLinks]))

    const contact = data.contact || {}
    const contactParts: { text: string; isLink?: boolean }[] = []
    if (contact.email) contactParts.push({ text: contact.email })
    if (contact.phone) contactParts.push({ text: formatPhone(contact.phone) })
    if (contact.location) contactParts.push({ text: contact.location })
    if (contact.linkedin) contactParts.push({ text: contact.linkedin, isLink: true })

    const hasCerts = (data.certifications?.length ?? 0) > 0
    const hasAchievements = (data.keyAchievements?.length ?? 0) > 0
    const hasProjects = (data.projects?.length ?? 0) > 0
    const hasLanguages = (data.languages?.length ?? 0) > 0
    const hasAdditional = (data.additionalSections?.length ?? 0) > 0

    return (
        <Document>
            <Page size="A4" style={s.page} wrap>
                {/* ─── Header ─── */}
                <View style={s.headerWrap} wrap={false}>
                    <Text style={s.name}>{contact.name || 'Your Name'}</Text>
                    <View style={s.contactRow}>
                        {contactParts.map((part, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {i > 0 && <Text style={s.contactSep}>|</Text>}
                                {part.isLink ? (
                                    <Link src={part.text.startsWith('http') ? part.text : `https://${part.text}`}>
                                        <Text style={s.linkText}>{part.text}</Text>
                                    </Link>
                                ) : (
                                    <Text style={s.contactItem}>{part.text}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={s.body}>
                    {/* ─── Summary ─── */}
                    <Section title={isPremium ? 'Executive Summary' : 'Professional Summary'} wrap={false}>
                        <Text style={{ fontSize: 9, lineHeight: 1.45, color: C.text }}>{data.summary}</Text>
                    </Section>

                    {/* ─── Experience ─── */}
                    <Section title="Professional Experience">
                        {data.experience?.map((exp, i) => (
                            <View key={i} style={s.jobBlock} wrap={false} minPresenceAhead={35}>
                                <View style={s.jobRow}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
                                        <Text style={s.jobTitle}>{exp.role}</Text>
                                        <Text style={s.jobSep}>|</Text>
                                        <Text style={s.jobCompany}>{exp.company}</Text>
                                    </View>
                                    <Text style={s.jobMeta}>
                                        {[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}
                                    </Text>
                                </View>
                                {exp.bullets?.map((b, j) => (
                                    <Bullet key={j} text={b} />
                                ))}
                            </View>
                        ))}
                    </Section>

                    {/* ─── Core Competencies ─── */}
                    <Section title={isPremium ? 'Core Competencies' : 'Skills'}>
                        <View style={s.skillsWrap}>
                            {data.skills?.map((skill, i) => (
                                <Text key={i} style={s.skillTag}>{skill}</Text>
                            ))}
                        </View>
                    </Section>

                    {/* ─── Education ─── */}
                    <Section title="Education">
                        {data.education?.map((edu, i) => (
                            <View key={i} style={s.eduBlock} wrap={false}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.eduDegree}>{edu.degree}</Text>
                                        <Text style={s.eduSchool}>{edu.school}</Text>
                                    </View>
                                    <Text style={s.eduDate}>{edu.date}</Text>
                                </View>
                            </View>
                        ))}
                    </Section>

                    {/* ─── Certifications ─── */}
                    {hasCerts && (
                        <Section title="Certifications">
                            {data.certifications!.map((cert, i) => (
                                <Bullet key={i} text={cert} />
                            ))}
                        </Section>
                    )}

                    {/* ─── Key Achievements ─── */}
                    {hasAchievements && (
                        <Section title="Key Achievements">
                            {data.keyAchievements!.map((a, i) => (
                                <Bullet key={i} text={a} />
                            ))}
                        </Section>
                    )}

                    {/* ─── Projects ─── */}
                    {hasProjects && (
                        <Section title="Projects">
                            {data.projects!.map((p, i) => (
                                <View key={i} style={s.jobBlock} wrap={false}>
                                    <Text style={s.jobTitle}>{p.name}</Text>
                                    <Text style={s.bulletText}>{p.description}</Text>
                                    {!!p.technologies?.length && (
                                        <Text style={s.projectTech}>Technologies: {p.technologies.join(', ')}</Text>
                                    )}
                                    {p.url && (
                                        <Link src={p.url}>
                                            <Text style={s.linkText}>{p.url}</Text>
                                        </Link>
                                    )}
                                </View>
                            ))}
                        </Section>
                    )}

                    {/* ─── Portfolio Links ─── */}
                    {allLinks.length > 0 && (
                        <Section title="Portfolio" wrap={false}>
                            {allLinks.map((link, i) => (
                                <Link key={i} src={link}>
                                    <Text style={{ ...s.linkText, marginBottom: 2 }}>{link}</Text>
                                </Link>
                            ))}
                        </Section>
                    )}

                    {/* ─── Languages ─── */}
                    {hasLanguages && (
                        <Section title="Languages" wrap={false}>
                            <View style={s.skillsWrap}>
                                {data.languages!.map((l, i) => (
                                    <Text key={i} style={s.skillTag}>{l.language} ({l.proficiency})</Text>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* ─── Additional Sections ─── */}
                    {hasAdditional && data.additionalSections!.map((sec, i) => (
                        <Section key={i} title={sec.title}>
                            {sec.items.map((item, j) => (
                                <Bullet key={j} text={item} />
                            ))}
                        </Section>
                    ))}
                </View>
            </Page>
        </Document>
    )
}
