// ── Browser-global polyfills for pdfjs-dist in Node.js ──
// pdfjs-dist expects DOMMatrix, ImageData, and Path2D to exist globally.
// In Next.js server runtime these are missing, causing
// "Object.defineProperty called on non-object" crashes.
const g = globalThis as Record<string, unknown>

if (!g.DOMMatrix) {
    g.DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
        m11 = 1; m12 = 0; m13 = 0; m14 = 0
        m21 = 0; m22 = 1; m23 = 0; m24 = 0
        m31 = 0; m32 = 0; m33 = 1; m34 = 0
        m41 = 0; m42 = 0; m43 = 0; m44 = 1
        is2D = true; isIdentity = true
        constructor(_init?: string | number[]) { }
        multiply() { return new (g.DOMMatrix as new () => unknown)() }
        translate() { return new (g.DOMMatrix as new () => unknown)() }
        scale() { return new (g.DOMMatrix as new () => unknown)() }
        inverse() { return new (g.DOMMatrix as new () => unknown)() }
        transformPoint() { return { x: 0, y: 0, z: 0, w: 1 } }
    }
}

if (!g.ImageData) {
    g.ImageData = class ImageData {
        data: Uint8ClampedArray; width: number; height: number; colorSpace = 'srgb'
        constructor(w: number, h: number) {
            this.width = w; this.height = h
            this.data = new Uint8ClampedArray(w * h * 4)
        }
    }
}

if (!g.Path2D) {
    g.Path2D = class Path2D {
        addPath() { } closePath() { } moveTo() { } lineTo() { } bezierCurveTo() { }
        quadraticCurveTo() { } arc() { } arcTo() { } ellipse() { } rect() { }
    }
}

type PromiseResolvers<T> = {
    promise: Promise<T>
    resolve: (value: T | PromiseLike<T>) => void
    reject: (reason?: unknown) => void
}

type PromiseWithResolvers = <T>() => PromiseResolvers<T>
type PdfParseV2TextResult = { text?: string }
type PdfParseV2Instance = {
    getText: () => Promise<PdfParseV2TextResult>
    destroy?: () => Promise<void>
}
type PdfParseV2Ctor = new (args: { data: Buffer }) => PdfParseV2Instance
type PdfJsWorkerModule = { WorkerMessageHandler?: unknown }
type GlobalWithPdfJsWorker = typeof globalThis & { pdfjsWorker?: PdfJsWorkerModule }
type PdfJsTextItem = {
    str?: string
    hasEOL?: boolean
    transform?: number[]
}

type PositionedToken = {
    text: string
    x: number
    y: number
    order: number
}

function ensurePromiseWithResolvers() {
    const promiseCtor = Promise as PromiseConstructor & { withResolvers?: PromiseWithResolvers }
    if (typeof promiseCtor.withResolvers === 'function') return

    promiseCtor.withResolvers = function <T>() {
        let resolve!: (value: T | PromiseLike<T>) => void
        let reject!: (reason?: unknown) => void
        const promise = new Promise<T>((res, rej) => {
            resolve = res
            reject = rej
        })
        return { promise, resolve, reject }
    }
}

function normalizeText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}

function extractPdfJsLines(items: PdfJsTextItem[]): string[] {
    const tokens = items
        .map((item, index) => ({
            text: item.str?.trim() || '',
            hasEOL: Boolean(item.hasEOL),
            x: item.transform?.[4],
            y: item.transform?.[5],
            order: index,
        }))
        .filter((token) => token.text.length > 0)

    if (tokens.length === 0) return []

    // pdf.js sometimes exposes reliable line ends via hasEOL.
    if (tokens.some((token) => token.hasEOL)) {
        const lines: string[] = []
        let current: string[] = []

        for (const token of tokens) {
            current.push(token.text)
            if (token.hasEOL) {
                lines.push(current.join(' ').trim())
                current = []
            }
        }

        if (current.length > 0) lines.push(current.join(' ').trim())
        return lines.filter(Boolean)
    }

    const positioned: PositionedToken[] = tokens
        .filter((token) => Number.isFinite(token.x) && Number.isFinite(token.y))
        .map((token) => ({
            text: token.text,
            x: token.x as number,
            y: token.y as number,
            order: token.order,
        }))

    if (positioned.length < Math.ceil(tokens.length * 0.6)) {
        return [tokens.map((token) => token.text).join(' ').trim()].filter(Boolean)
    }

    const LINE_TOLERANCE = 2
    const buckets: Array<{ y: number; tokens: PositionedToken[] }> = []

    for (const token of positioned) {
        const bucket = buckets.find((item) => Math.abs(item.y - token.y) <= LINE_TOLERANCE)
        if (bucket) {
            bucket.tokens.push(token)
            continue
        }
        buckets.push({ y: token.y, tokens: [token] })
    }

    return buckets
        .sort((a, b) => b.y - a.y)
        .map((bucket) =>
            bucket.tokens
                .sort((a, b) => (a.x === b.x ? a.order - b.order : a.x - b.x))
                .map((token) => token.text)
                .join(' ')
                .trim()
        )
        .filter(Boolean)
}

async function ensurePdfJsWorkerGlobal() {
    const runtime = globalThis as GlobalWithPdfJsWorker
    if (runtime.pdfjsWorker?.WorkerMessageHandler) return

    try {
        // @ts-expect-error pdfjs-dist worker module lacks type declarations
        runtime.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs') as PdfJsWorkerModule
    } catch (error) {
        console.warn('[PDF] Failed to pre-load pdfjs worker module:', error)
    }
}

async function extractWithPdfJsLegacy(buffer: Buffer): Promise<string> {
    ensurePromiseWithResolvers()
    await ensurePdfJsWorkerGlobal()

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    // In Next.js Turbopack server chunks, relative worker paths can resolve
    // against `.next/.../chunks` and fail. Force a package specifier instead.
    pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs'
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true,
        useSystemFonts: true,
        verbosity: pdfjs.VerbosityLevel.ERRORS,
    })

    const pdf = await loadingTask.promise
    try {
        const pages: string[] = []

        for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
            const page = await pdf.getPage(pageIndex)
            const content = await page.getTextContent()
            const lines = extractPdfJsLines(content.items as PdfJsTextItem[])
            const pageText = lines.join('\n')

            if (pageText) pages.push(pageText)
            page.cleanup()
        }

        return normalizeText(pages.join('\n'))
    } finally {
        await pdf.destroy()
    }
}

async function extractWithPdfParseV2(buffer: Buffer): Promise<string> {
    const pdfParseModule = await import('pdf-parse')
    const PDFParse = (pdfParseModule as { PDFParse?: PdfParseV2Ctor }).PDFParse

    if (typeof PDFParse !== 'function') return ''

    const parser = new PDFParse({ data: buffer })
    try {
        const result = await parser.getText()
        return normalizeText(result?.text || '')
    } finally {
        if (typeof parser.destroy === 'function') {
            await parser.destroy().catch(() => undefined)
        }
    }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) return ''

    const extractors: Array<{ name: string, run: () => Promise<string> }> = [
        { name: 'pdfjs-legacy', run: () => extractWithPdfJsLegacy(buffer) },
        { name: 'pdf-parse-v2', run: () => extractWithPdfParseV2(buffer) },
    ]

    for (const extractor of extractors) {
        try {
            const text = await extractor.run()
            if (text) return text
        } catch (error) {
            console.error(`[PDF] ${extractor.name} failed:`, error)
        }
    }

    return ''
}
