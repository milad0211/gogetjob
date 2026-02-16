'use client'

import { useState } from 'react'
import { updateUserPlan } from '@/app/admin/actions'
import { X, Save, RefreshCw } from 'lucide-react'

export function EditUserModal({ user, onClose }: { user: any, onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [plan, setPlan] = useState<'free' | 'pro'>(user.plan)

    const handleSave = async () => {
        setLoading(true)
        await updateUserPlan(user.id, plan)
        setLoading(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Edit User</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input type="text" value={user.email} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-500 text-sm font-mono cursor-not-allowed" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                        <input type="text" value={user.full_name || ''} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-500 text-sm" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subscription Plan</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPlan('free')}
                                className={`px-4 py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${plan === 'free' ? 'bg-slate-100 border-slate-300 text-slate-900 border-2' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                                Free Starter
                            </button>
                            <button
                                onClick={() => setPlan('pro')}
                                className={`px-4 py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${plan === 'pro' ? 'bg-blue-50 border-blue-500 text-blue-700 border-2' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'}`}
                            >
                                Pro Plan
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>User ID:</span>
                            <span className="font-mono">{user.id.slice(0, 8)}...</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}
