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
    const [jobMode, setJobMode] = useState<'url' | 'paste'>('url')
    const [jobValue, setJobValue] = useState('')
    const [generationId, setGenerationId] = useState<string | null>(null)

    const router = useRouter()

    const handleGeneration = async () => {
        if (!file || !jobValue) return
        setStep('generating')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('jobMode', jobMode)
        formData.append(jobMode === 'url' ? 'jobUrl' : 'jobText', jobValue)

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                throw new Error('Generation failed')
            }

            const data = await res.json()
            setGenerationId(data.id)
            router.push(`/dashboard/resume/${data.id}`)

        } catch (error) {
            console.error(error)
            alert('An error occurred. Please try again.')
            setStep('job')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Stepper Header */}
                <div className="mb-12">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -z-10"></div>

                        <StepIndicator number={1} title="Upload Resume" active={step === 'upload'} completed={step !== 'upload'} />
                        <StepIndicator number={2} title="Job Title" active={step === 'job'} completed={['job', 'generating', 'complete'].includes(step)} />
                        <StepIndicator number={3} title="Generate" active={step === 'generating'} completed={step === 'complete'} />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8 transition-all">
                    {step === 'upload' && (
                        <UploadStep
                            file={file}
                            setFile={setFile}
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
                            onGenerate={handleGeneration}
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
