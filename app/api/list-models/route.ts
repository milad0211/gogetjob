import { NextResponse } from "next/server";

export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: { "x-goog-api-key": key },
    });

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}
