import { GoogleGenerativeAI } from '@google/generative-ai'

// Validate API Key
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
    console.error('GEMINI_API_KEY is missing in environment variables!')
}

const genAI = new GoogleGenerativeAI(apiKey)

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
