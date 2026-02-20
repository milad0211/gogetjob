import { GoogleGenerativeAI } from '@google/generative-ai'

// Validate API Key
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is missing! AI features will fail.')
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key')

// Use 'gemini-1.5-flash' for high speed and good reasoning at low cost
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
