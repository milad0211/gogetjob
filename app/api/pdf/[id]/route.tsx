import { createClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { ResumePdf } from '@/app/dashboard/resume/[id]/_components/ResumePdf'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const shouldDownload = searchParams.get('download') === '1'
    const modeParam = searchParams.get('mode')
    const mode = modeParam === 'premium' ? 'premium' : 'ats'

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: generation } = await supabase
        .from('resume_generations')
        .select('resume_generated_text')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!generation) {
        return new NextResponse('Not Found', { status: 404 })
    }

    const data = typeof generation.resume_generated_text === 'string'
        ? JSON.parse(generation.resume_generated_text)
        : generation.resume_generated_text

    const stream = await renderToStream(<ResumePdf data={data} mode={mode} />)

    // Convert Node stream to Web Stream
    const responseStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                controller.enqueue(chunk)
            }
            controller.close()
        },
    })

    return new NextResponse(responseStream, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': shouldDownload
                ? `attachment; filename="resume-${mode}-${id}.pdf"`
                : `inline; filename="resume-${mode}-${id}.pdf"`,
        },
    })
}
