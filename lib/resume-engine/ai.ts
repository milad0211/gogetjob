import { geminiModel } from '@/lib/gemini'

export interface RewrittenResume {
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
}

export async function rewriteResume(currentResume: string, jobDescription: string): Promise<RewrittenResume> {
    const prompt = `
    You are an expert Resume Writer and ATS Optimizer.
    
    Task: Rewrite the provided resume to perfectly match the target job description.
    
    Rules:
    1. Do NOT invent false experiences. Use the existing resume as the source of truth.
    2. Optimize the "Summary" to align with the JD's mission.
    3. Rewrite "Experience" bullet points to use strong action verbs and include keywords from the JD naturally.
    4. Extract and prioritize "Skills" found in the JD that the candidate possesses.
    5. Return JSON format only.
    
    Output JSON Schema:
    {
        "summary": "string",
        "experience": [{ "role": "string", "company": "string", "date": "string", "bullets": ["string"] }],
        "skills": ["string"],
        "education": [{ "degree": "string", "school": "string", "date": "string" }]
    }

    Target Job Description:
    ${jobDescription.substring(0, 3000)}

    Current Resume:
    ${currentResume.substring(0, 5000)}
  `

    try {
        const result = await geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
        const responseText = result.response.text()

        if (!responseText) throw new Error("No content from Gemini")
        return JSON.parse(responseText) as RewrittenResume
    } catch (e) {
        console.error("Gemini Parse Error", e)
        throw new Error("Failed to parse AI response")
    }
}
