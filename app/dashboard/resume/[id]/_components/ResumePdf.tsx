import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

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
        date: string
        bullets: string[]
    }[]
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
                                <Text style={styles.jobDate}>{exp.date}</Text>
                            </View>
                            {exp.bullets?.map((bull, j) => (
                                <Text key={j} style={styles.bullet}>• {bull}</Text>
                            ))}
                        </View>
                    ))}
                </View>

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
