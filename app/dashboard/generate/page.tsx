'use client'

import { useState } from 'react'
import { UploadStep } from './_components/UploadStep'
import { JobDescriptionStep } from './_components/JobDescriptionStep'
import { GeneratingStep } from './_components/GeneratingStep'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Zap, Crown, ArrowRight } from 'lucide-react'

export type GenerationState = 'upload' | 'job' | 'generating' | 'complete'

// Limit-reached error codes returned by the API
const LIMIT_CODES = new Set(['free_limit_reached', 'pro_limit_reached', 'limit_reached'])

interface LimitInfo {
    code: string
    message: string
    remaining: number
    limit: number
    resets_at: string | null
}

export default function GeneratePage() {
    const [step, setStep] = useState<GenerationState>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [jobMode, setJobMode] = useState<'url' | 'paste'>('url')
    const [jobValue, setJobValue] = useState('')
    const [limitReached, setLimitReached] = useState<LimitInfo | null>(null)

    const router = useRouter()

    const handleGeneration = async () => {
        if (!file || !jobValue) return
        setStep('generating')
        setLimitReached(null)

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
                const payload = await res.json().catch(() => null)

                // Check if this is a limit-reached error
                if (res.status === 402 && payload?.code && LIMIT_CODES.has(payload.code)) {
                    setLimitReached({
                        code: payload.code,
                        message: payload.error,
                        remaining: payload.remaining ?? 0,
                        limit: payload.limit ?? 0,
                        resets_at: payload.resets_at ?? null,
                    })
                    setStep('job')
                    return
                }

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

                {/* Limit Reached Banner */}
                {limitReached && (
                    <LimitReachedBanner info={limitReached} />
                )}

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

function LimitReachedBanner({ info }: { info: LimitInfo }) {
    const isFree = info.code === 'free_limit_reached'

    return (
        <div className={`mb-8 rounded-2xl border-2 overflow-hidden shadow-lg animate-fade-in-up ${isFree ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
            <div className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${isFree ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-1 ${isFree ? 'text-amber-900' : 'text-blue-900'}`}>
                            {isFree ? 'Free Generations Used Up' : 'Pro Limit Reached'}
                        </h3>
                        <p className={`text-sm mb-4 ${isFree ? 'text-amber-700' : 'text-blue-700'}`}>
                            {info.message}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {isFree ? (
                                <>
                                    <Link
                                        href="/dashboard/billing"
                                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5"
                                    >
                                        <Zap size={16} /> Upgrade to Pro Monthly — $50/mo
                                    </Link>
                                    <Link
                                        href="/dashboard/billing"
                                        className="inline-flex items-center justify-center gap-2 bg-white border-2 border-indigo-200 hover:border-indigo-300 text-indigo-700 px-6 py-3 rounded-xl text-sm font-bold transition hover:-translate-y-0.5"
                                    >
                                        <Crown size={16} /> Go Pro Yearly — $400/yr (Save 33%)
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {info.resets_at && (
                                        <div className="text-sm font-medium text-blue-700 bg-blue-100 px-4 py-2 rounded-lg">
                                            ⏱ Resets on {new Date(info.resets_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    )}
                                    <Link
                                        href="/dashboard/billing"
                                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition hover:-translate-y-0.5"
                                    >
                                        <Crown size={16} /> Upgrade to Pro Yearly — 360/year <ArrowRight size={14} />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
