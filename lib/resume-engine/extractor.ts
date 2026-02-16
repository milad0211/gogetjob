const pdf = require('pdf-parse');

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    const data = await pdf(buffer)
    // Clean up text: remove excessive newlines/spaces
    return data.text.replace(/\n\s*\n/g, '\n').trim()
}
