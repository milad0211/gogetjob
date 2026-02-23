'use client'
import { UploadCloud, FileWarning, BadgeCheck } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'

type UploadStepProps = {
    file: File | null
    setFile: (file: File | null) => void
    onNext: () => void
}

type UploadWarning = {
    title: string
    message: string
}

export function UploadStep({ file, setFile, onNext }: UploadStepProps) {
    const [warning, setWarning] = useState<UploadWarning | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selected = acceptedFiles[0]
        if (!selected) return
        setWarning(null)
        setFile(selected)
        onNext()
    }, [onNext, setFile])

    const onDropRejected = useCallback((rejections: FileRejection[]) => {
        const first = rejections[0]
        const firstError = first?.errors?.[0]
        if (!firstError) return

        if (firstError.code === 'file-invalid-type') {
            setWarning({
                title: 'Only PDF files are supported',
                message: 'Please export your resume as PDF and upload again. Supported format: .pdf',
            })
            return
        }

        if (firstError.code === 'file-too-large') {
            setWarning({
                title: 'File is too large',
                message: 'Maximum allowed size is 5MB. Compress your PDF and try again.',
            })
            return
        }

        setWarning({
            title: 'Upload failed',
            message: firstError.message || 'Please upload a valid PDF file (max 5MB).',
        })
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: 5 * 1024 * 1024,
        multiple: false,
    })

    return (
        <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Upload Your Current Resume</h2>
            <p className="text-slate-600 mb-8">We accept PDF format (Max 5MB)</p>

            {warning && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-left animate-fade-in-up">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <FileWarning size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">{warning.title}</p>
                            <p className="text-sm text-amber-800 mt-1">{warning.message}</p>
                        </div>
                    </div>
                </div>
            )}

            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 transition cursor-pointer 
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}>
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud size={32} />
                </div>

                {isDragActive ? (
                    <p className="text-blue-600 font-medium">Drop the file here ...</p>
                ) : (
                    <div>
                        <p className="text-slate-900 font-medium mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500">PDF only (max. 5MB)</p>
                    </div>
                )}
            </div>

            {file && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <BadgeCheck size={16} />
                    <span>{file.name}</span>
                </div>
            )}
        </div>
    )
}
