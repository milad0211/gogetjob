'use client'
import { Loader2 } from 'lucide-react'

export function GeneratingStep() {
    return (
        <div className="text-center py-20">
            <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping"></div>
                <div className="relative bg-white p-4 rounded-full shadow-sm border border-slate-100">
                    <Loader2 size={48} className="text-blue-600 animate-spin" />
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 animate-pulse">Analyzing Job Requirements...</h2>
            <p className="text-slate-500 max-w-md mx-auto">
                This usually takes 10-20 seconds. We are extracting keywords, identifying gaps, and rewriting your bullet points.
            </p>
        </div>
    )
}
