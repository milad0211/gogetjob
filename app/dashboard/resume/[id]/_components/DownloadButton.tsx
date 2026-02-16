'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { ResumePdf } from './ResumePdf'
import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'

export function DownloadButton({ data }: { data: any }) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) return null

    return (
        <PDFDownloadLink document={<ResumePdf data={data} />} fileName="resume-optimized.pdf">
            {({ loading }) => (
                <button
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition disabled:opacity-50"
                >
                    <Download size={20} />
                    {loading ? 'در حال آماده‌سازی...' : 'دانلود PDF'}
                </button>
            )}
        </PDFDownloadLink>
    )
}
