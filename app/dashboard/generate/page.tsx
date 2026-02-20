'use client'

import { useState } from 'react'
import { UploadStep } from './_components/UploadStep'
import { JobDescriptionStep } from './_components/JobDescriptionStep'
import { GeneratingStep } from './_components/GeneratingStep'
import { useRouter } from 'next/navigation'

export type GenerationState = 'upload' | 'job' | 'generating' | 'complete'

export default function GeneratePage() {
    const [step, setStep] = useState<GenerationState>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [photo, setPhoto] = useState<string | null>(null)
    const [jobMode, setJobMode] = useState<'url' | 'paste'>('url')
    const [jobValue, setJobValue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const router = useRouter()

    const handleGeneration = async () => {
        if (!file || !jobValue) return
        setIsSubmitting(true)
        setStep('generating')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('jobMode', jobMode)
        formData.append(jobMode === 'url' ? 'jobUrl' : 'jobText', jobValue)
        if (photo) formData.append('photoDataUrl', photo)

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const payload = await res.json().catch(() => null)
                const message = payload?.error || payload?.details || `Generation failed (${res.status})`
                throw new Error(message)
            }

            const data = await res.json()
            router.push(`/dashboard/resume/${data.id}`)

        } catch (error) {
            console.error(error)
            const message = error instanceof Error ? error.message : 'An error occurred. Please try again.'
            alert(message)
            setStep('job')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGenerateClick = async () => {
        await handleGeneration()
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Stepper Header */}
                <div className="mb-12">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -z-10"></div>

                        <StepIndicator number={1} title="Upload Resume" active={step === 'upload'} completed={step !== 'upload'} />
                        <StepIndicator number={2} title="Job Details" active={step === 'job'} completed={['job', 'generating', 'complete'].includes(step)} />
                        <StepIndicator number={3} title="Generate" active={step === 'generating'} completed={step === 'complete'} />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8 transition-all">
                    {step === 'upload' && (
                        <UploadStep
                            file={file}
                            setFile={setFile}
                            photo={photo}
                            setPhoto={setPhoto}
                            onNext={() => setStep('job')}
                        />
                    )}

                    {step === 'job' && (
                        <JobDescriptionStep
                            mode={jobMode}
                            setMode={setJobMode}
                            value={jobValue}
                            setValue={setJobValue}
                            onBack={() => setStep('upload')}
                            onGenerate={handleGenerateClick}
                        />
                    )}

                    {step === 'generating' && (
                        <GeneratingStep />
                    )}
                </div>
            </div>
        </div>
    )
}

function StepIndicator({ number, title, active, completed }: { number: number, title: string, active: boolean, completed: boolean }) {
    return (
        <div className="flex flex-col items-center bg-slate-50 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors border-4 
        ${completed ? 'bg-green-500 border-green-500 text-white' :
                    active ? 'bg-blue-600 border-blue-200 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                {completed ? '✓' : number}
            </div>
            <span className={`mt-2 text-sm font-medium ${active || completed ? 'text-slate-900' : 'text-slate-400'}`}>
                {title}
            </span>
        </div>
    )
}
