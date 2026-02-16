'use client'
import { UploadCloud } from 'lucide-react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export function UploadStep({ file, setFile, onNext }: any) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFile(acceptedFiles[0])
        onNext()
    }, [onNext, setFile])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } })

    return (
        <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Upload Your Current Resume</h2>
            <p className="text-slate-600 mb-8">We accept PDF format (Max 5MB)</p>

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
        </div>
    )
}
