'use client'

import { updateUserPlan, deleteUser } from '../actions'
import { Shield, ShieldOff, Trash2, Activity } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

type AdminUserRow = {
    id: string
    email: string
    full_name?: string | null
    plan: 'free' | 'pro'
    is_admin?: boolean | null
    generationCount?: number
    lastGenerationAt?: string | null
}

export function ClientUserRow({ user, showMonitoring }: { user: AdminUserRow; showMonitoring?: boolean }) {
    const [loading, setLoading] = useState(false)

    const handlePlanChange = async (newPlan: 'free' | 'pro') => {
        if (!confirm(`Are you sure you want to change this user to ${newPlan}?`)) return
        setLoading(true)
        await updateUserPlan(user.id, newPlan)
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure? This is irreversible.')) return
        setLoading(true)
        await deleteUser(user.id)
        setLoading(false)
    }

    return (
        <tr className="hover:bg-slate-50 transition">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{user.full_name || 'No Name'}</div>
                        <div className="text-slate-500 text-xs font-mono">{user.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${uSePlanStyles(user.plan)}`}>
                    {user.plan === 'pro' ? 'PRO PLAN' : 'FREE TIER'}
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                    {user.is_admin ? 'ADMIN' : 'USER'}
                </span>
            </td>
            {showMonitoring && (
                <>
                    <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{user.generationCount || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                        {user.lastGenerationAt
                            ? new Date(user.lastGenerationAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : 'No activity'}
                    </td>
                </>
            )}
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-80 hover:opacity-100">
                    {showMonitoring && (
                        <Link
                            href={`/admin/activity?userId=${user.id}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                            title="View Activity"
                        >
                            <Activity size={18} />
                        </Link>
                    )}
                    <button
                        disabled={loading}
                        onClick={() => handlePlanChange(user.plan === 'pro' ? 'free' : 'pro')}
                        className={`p-2 rounded-lg transition ${user.plan === 'pro' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={user.plan === 'pro' ? "Downgrade to Free" : "Upgrade to Pro"}
                    >
                        {user.plan === 'pro' ? <ShieldOff size={18} /> : <Shield size={18} />}
                    </button>

                    <button
                        disabled={loading}
                        onClick={handleDelete}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete User"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    )
}

function uSePlanStyles(plan: string) {
    if (plan === 'pro') return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700'
    return 'bg-slate-50 border-slate-200 text-slate-600'
}
