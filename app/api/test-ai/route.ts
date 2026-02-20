import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'GEMINI_API_KEY missing'
            }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite'
        })

        const result = await model.generateContent('Say hello in one sentence')

        return NextResponse.json({
            success: true,
            text: result.response.text()
        })

    } catch (err: any) {
        console.error(err)

        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 })
    }
}
