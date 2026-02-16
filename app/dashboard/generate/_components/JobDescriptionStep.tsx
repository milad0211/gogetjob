'use client'
import { Link2, FileText, ArrowRight } from 'lucide-react'

export function JobDescriptionStep({ mode, setMode, value, setValue, onBack, onGenerate }: any) {
    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Add Job Description</h2>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-8 max-w-sm mx-auto">
                <button
                    onClick={() => setMode('url')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition 
          ${mode === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Link2 size={16} /> Job URL
                </button>
                <button
                    onClick={() => setMode('paste')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition 
          ${mode === 'paste' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText size={16} /> Paste Text
                </button>
            </div>

            <div className="mb-8">
                {mode === 'url' ? (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Job Post URL (LinkedIn, Indeed, etc.)</label>
                        <input
                            type="url"
                            placeholder="https://www.linkedin.com/jobs/view/..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Note: Some sites block automated access. If URL fails, please copy-paste the text.
                        </p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Job Description Text</label>
                        <textarea
                            rows={8}
                            placeholder="Paste the full job description here..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                    onClick={onBack}
                    className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2"
                >
                    Back
                </button>
                <button
                    onClick={onGenerate}
                    disabled={!value}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Generate Resume <ArrowRight size={18} />
                </button>
            </div>
        </div>
    )
}
