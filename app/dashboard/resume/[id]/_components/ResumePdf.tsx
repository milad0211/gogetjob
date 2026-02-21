import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Register fonts if needed, or use standard ones
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
        color: '#333'
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    contact: {
        fontSize: 10,
        color: '#666',
        marginBottom: 4
    },
    section: {
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 6,
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 2
    },
    jobBlock: {
        marginBottom: 10
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2
    },
    jobTitle: {
        fontWeight: 'bold'
    },
    jobDate: {
        fontSize: 10,
        color: '#666'
    },
    bullet: {
        marginLeft: 10,
        marginBottom: 2
    },
    skillList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4
    }
})

interface ResumeData {
    summary: string
    experience: {
        role: string
        company: string
        startDate: string
        endDate: string
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
    contact?: {
        name?: string
        email?: string
        phone?: string
        linkedin?: string
    }
}

export function ResumePdf({ data, mode }: { data: ResumeData; mode?: 'ats' | 'premium' }) {
    const isPremium = mode === 'premium'
    const projectLinks = (data.projects || []).flatMap((project) => {
        const links: string[] = project.description.match(/\bhttps?:\/\/[^\s)]+/gi) || []
        if (project.url) links.push(project.url)
        return links
    })
    const allLinks = Array.from(new Set([...(data.portfolioLinks || []), ...projectLinks]))

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{data.contact?.name || 'Your Name'}</Text>
                    <Text style={styles.contact}>
                        {data.contact?.email} | {data.contact?.phone} | {data.contact?.linkedin}
                    </Text>
                </View>

                {/* Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {isPremium ? 'Executive Summary' : 'Professional Summary'}
                    </Text>
                    <Text>{data.summary}</Text>
                </View>

                {/* Experience */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experience</Text>
                    {data.experience?.map((exp, i) => (
                        <View key={i} style={styles.jobBlock}>
                            <View style={styles.jobHeader}>
                                <Text style={styles.jobTitle}>{exp.role} at {exp.company}</Text>
                                <Text style={styles.jobDate}>{[exp.startDate, exp.endDate].filter(Boolean).join(' - ')}</Text>
                            </View>
                            {exp.bullets?.map((bull, j) => (
                                <Text key={j} style={styles.bullet}>• {bull}</Text>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Projects */}
                {!!data.projects?.length && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        {data.projects.map((project, i) => (
                            <View key={i} style={styles.jobBlock}>
                                <Text style={styles.jobTitle}>{project.name}</Text>
                                <Text>{project.description}</Text>
                                {!!project.technologies?.length && (
                                    <Text style={styles.contact}>Tech: {project.technologies.join(', ')}</Text>
                                )}
                                {project.url && <Text style={styles.contact}>{project.url}</Text>}
                            </View>
                        ))}
                    </View>
                )}

                {/* Portfolio Links */}
                {allLinks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Portfolio Links</Text>
                        {allLinks.map((link, i) => (
                            <Text key={i} style={styles.bullet}>• {link}</Text>
                        ))}
                    </View>
                )}

                {/* Skills */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillList}>
                        <Text>{data.skills?.join(' | ')}</Text>
                    </View>
                </View>

                {/* Education */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Education</Text>
                    {data.education?.map((edu, i) => (
                        <View key={i} style={styles.jobBlock}>
                            <View style={styles.jobHeader}>
                                <Text style={styles.jobTitle}>{edu.degree}, {edu.school}</Text>
                                <Text style={styles.jobDate}>{edu.date}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    )
}
