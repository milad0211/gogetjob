'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { ResumePdf } from './ResumePdf'
import { Download } from 'lucide-react'
import { useSyncExternalStore } from 'react'

type ResumePdfData = Parameters<typeof ResumePdf>[0]['data']

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function DownloadButton({ data, mode = 'premium' }: { data: ResumePdfData; mode?: 'ats' | 'premium' }) {
  const isClient = useIsClient()

  if (!isClient) return null

  const fileName = mode === 'premium' ? 'resume-premium.pdf' : 'resume-optimized.pdf'

  return (
    <PDFDownloadLink document={<ResumePdf data={data} mode={mode} />} fileName={fileName}>
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition disabled:opacity-50"
        >
          <Download size={20} />
          {loading ? 'Preparing...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
