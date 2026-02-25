'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
    Activity,
    Clock3,
    Crown,
    MoreHorizontal,
    RotateCcw,
    Shield,
    ShieldOff,
    Sparkles,
    Trash2,
    UserMinus,
} from 'lucide-react'
import {
    clearUserGenerations,
    deleteUser,
    extendProAccess,
    resetUserUsage,
    toggleUserAdmin,
    updateUserPlan,
} from '../actions'

type AdminUserRow = {
    id: string
    email: string
    full_name?: string | null
    plan: 'free' | 'pro'
    subscription_status?: string | null
    billing_cycle?: string | null
    pro_access_until?: string | null
    is_admin?: boolean | null
    generationCount?: number
    total_generations_used?: number | null
    free_generations_used_total?: number | null
    pro_generations_used_cycle?: number | null
    pro_cover_letters_used_cycle?: number | null
    lastGenerationAt?: string | null
}

type Feedback = {
    kind: 'success' | 'error'
    text: string
}

type ActionResult = { error?: string; message?: string } | undefined

function formatDate(value?: string | null): string {
    if (!value) return 'No activity'
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getPlanTone(user: AdminUserRow): string {
    const activePro = user.plan === 'pro' && user.pro_access_until && new Date(user.pro_access_until) > new Date()
    if (activePro) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (user.plan === 'pro') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-slate-50 text-slate-600 border-slate-200'
}

function getPlanLabel(user: AdminUserRow): string {
    const activePro = user.plan === 'pro' && user.pro_access_until && new Date(user.pro_access_until) > new Date()
    if (activePro) return `Pro ${user.billing_cycle === 'year' ? 'Yearly' : 'Monthly'}`
    if (user.plan === 'pro') return 'Pro (Expired)'
    return 'Free'
}

export function ClientUserRow({
    user,
    showMonitoring,
    currentAdminId,
}: {
    user: AdminUserRow
    showMonitoring?: boolean
    currentAdminId?: string
}) {
    const router = useRouter()
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const [isPending, startTransition] = useTransition()

    const isSelf = currentAdminId === user.id
    const usage = user.plan === 'pro'
        ? `${user.pro_generations_used_cycle ?? 0} resumes • ${user.pro_cover_letters_used_cycle ?? 0} letters`
        : `${user.free_generations_used_total ?? 0} free generations used`

    const runAction = (runner: () => Promise<ActionResult>) => {
        startTransition(async () => {
            setFeedback(null)
            const result = await runner()
            if (result?.error) {
                setFeedback({ kind: 'error', text: result.error })
                return
            }

            setFeedback({ kind: 'success', text: result?.message || 'Action completed.' })
            router.refresh()
        })
    }

    return (
        <tr className="group border-b border-slate-100 transition hover:bg-slate-50/60">
            <td className="px-6 py-4 align-top">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{user.full_name || 'No Name'}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        <p className="mt-1 text-[11px] text-slate-400">ID: {user.id.slice(0, 8)}...</p>
                        {feedback && (
                            <p className={`mt-2 text-xs font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
                                {feedback.text}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            <td className="px-6 py-4 align-top">
                <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${getPlanTone(user)}`}>
                    {getPlanLabel(user)}
                </div>
                <p className="mt-2 text-xs text-slate-500">{usage}</p>
            </td>

            <td className="px-6 py-4 align-top">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${user.is_admin ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                </span>
                {isSelf && (
                    <p className="mt-2 text-[11px] text-slate-400">Current session</p>
                )}
            </td>

            {showMonitoring && (
                <>
                    <td className="px-6 py-4 align-top">
                        <p className="font-bold text-slate-900">{user.generationCount || 0}</p>
                        {!!user.total_generations_used && (
                            <p className="text-xs text-slate-500">Lifetime: {user.total_generations_used}</p>
                        )}
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-slate-500">
                        <div className="inline-flex items-center gap-1">
                            <Clock3 size={12} />
                            {formatDate(user.lastGenerationAt)}
                        </div>
                    </td>
                </>
            )}

            <td className="px-6 py-4 text-right align-top">
                <div className="inline-flex items-center justify-end gap-1.5">
                    {showMonitoring && (
                        <Link
                            href={`/admin/activity?userId=${user.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            title="Open activity feed"
                        >
                            <Activity size={14} />
                            Activity
                        </Link>
                    )}

                    <details className="relative">
                        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
                            <MoreHorizontal size={14} />
                            Manage
                        </summary>

                        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            <button
                                disabled={isPending}
                                onClick={() => {
                                    const target = user.plan === 'pro' ? 'free' : 'pro'
                                    if (!confirm(`Change plan to ${target.toUpperCase()}?`)) return
                                    runAction(() => updateUserPlan(user.id, target))
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {user.plan === 'pro' ? <ShieldOff size={15} className="text-amber-600" /> : <Crown size={15} className="text-emerald-600" />}
                                {user.plan === 'pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                            </button>

                            <button
                                disabled={isPending}
                                onClick={() => {
                                    if (!confirm('Extend Pro access by 30 days?')) return
                                    runAction(() => extendProAccess(user.id, 30))
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Sparkles size={15} className="text-blue-600" />
                                Extend Pro +30 days
                            </button>

                            <button
                                disabled={isPending}
                                onClick={() => {
                                    if (!confirm('Reset usage counters for this user?')) return
                                    runAction(() => resetUserUsage(user.id))
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RotateCcw size={15} className="text-teal-600" />
                                Reset usage counters
                            </button>

                            <button
                                disabled={isPending || isSelf}
                                onClick={() => {
                                    const next = !(user.is_admin ?? false)
                                    if (!confirm(`${next ? 'Grant' : 'Remove'} admin access?`)) return
                                    runAction(() => toggleUserAdmin(user.id, next))
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title={isSelf ? 'You cannot change your own admin role.' : undefined}
                            >
                                {user.is_admin ? <UserMinus size={15} className="text-violet-600" /> : <Shield size={15} className="text-violet-600" />}
                                {user.is_admin ? 'Remove admin role' : 'Grant admin role'}
                            </button>

                            <button
                                disabled={isPending}
                                onClick={() => {
                                    if (!confirm('Clear all generation records for this user?')) return
                                    runAction(() => clearUserGenerations(user.id))
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Trash2 size={15} className="text-amber-700" />
                                Clear generation history
                            </button>

                            <button
                                disabled={isPending || isSelf}
                                onClick={() => {
                                    if (!confirm('Delete profile? This action is destructive.')) return
                                    runAction(() => deleteUser(user.id))
                                }}
                                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title={isSelf ? 'You cannot delete your own account.' : undefined}
                            >
                                <Trash2 size={15} />
                                Delete profile
                            </button>
                        </div>
                    </details>
                </div>
            </td>
        </tr>
    )
}
