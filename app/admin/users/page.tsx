import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Search, SlidersHorizontal, UserCog, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ClientUserRow } from '@/app/admin/_components/ClientUserRow'

type UserSearchParams = Promise<{
    q?: string
    plan?: string
    role?: string
    activity?: string
    sort?: string
}>

type AdminUser = {
    id: string
    email: string
    full_name: string | null
    plan: 'free' | 'pro'
    is_admin: boolean | null
    subscription_status: string | null
    billing_cycle: 'month' | 'year' | null
    pro_access_until: string | null
    created_at: string
    total_generations_used: number | null
    free_generations_used_total: number | null
    pro_generations_used_cycle: number | null
    pro_cover_letters_used_cycle: number | null
}

type ActivityStat = {
    count: number
    failed: number
    success: number
    lastGenerationAt: string | null
}

function isProActive(user: Pick<AdminUser, 'plan' | 'pro_access_until'>): boolean {
    if (user.plan !== 'pro') return false
    if (!user.pro_access_until) return false
    return new Date(user.pro_access_until) > new Date()
}

function normalize(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase()
}

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: UserSearchParams
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) return redirect('/dashboard')

    const params = await searchParams
    const query = (params.q || '').trim().toLowerCase()
    const planFilter = params.plan || 'all'
    const roleFilter = params.role || 'all'
    const activityFilter = params.activity || 'all'
    const sortFilter = params.sort || 'newest'

    const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name, plan, is_admin, subscription_status, billing_cycle, pro_access_until, created_at, total_generations_used, free_generations_used_total, pro_generations_used_cycle, pro_cover_letters_used_cycle')
        .order('created_at', { ascending: false })

    const { data: activities } = await supabase
        .from('resume_generations')
        .select('user_id, created_at, status')
        .order('created_at', { ascending: false })
        .limit(30000)

    const activityByUser = new Map<string, ActivityStat>()
    for (const row of activities || []) {
        const existing = activityByUser.get(row.user_id)
        if (!existing) {
            activityByUser.set(row.user_id, {
                count: 1,
                failed: row.status === 'failed' ? 1 : 0,
                success: row.status === 'success' ? 1 : 0,
                lastGenerationAt: row.created_at,
            })
            continue
        }
        existing.count += 1
        if (row.status === 'failed') existing.failed += 1
        if (row.status === 'success') existing.success += 1
    }

    const typedUsers = (users || []) as AdminUser[]
    const usersWithStats = typedUsers.map((u) => {
        const stat = activityByUser.get(u.id)
        return {
            ...u,
            generationCount: u.total_generations_used ?? stat?.count ?? 0,
            failedCount: stat?.failed ?? 0,
            successCount: stat?.success ?? 0,
            lastGenerationAt: stat?.lastGenerationAt || null,
        }
    })

    const filteredUsers = usersWithStats
        .filter((u) => {
            if (query) {
                const haystack = [
                    normalize(u.full_name),
                    normalize(u.email),
                    u.id.toLowerCase(),
                ].join(' ')
                if (!haystack.includes(query)) return false
            }

            if (planFilter === 'free' && u.plan !== 'free') return false
            if (planFilter === 'pro' && u.plan !== 'pro') return false
            if (planFilter === 'pro_active' && !isProActive(u)) return false
            if (planFilter === 'pro_expired' && !(u.plan === 'pro' && !isProActive(u))) return false

            if (roleFilter === 'admin' && !u.is_admin) return false
            if (roleFilter === 'user' && u.is_admin) return false

            if (activityFilter === 'inactive' && (u.generationCount || 0) > 0) return false
            if (activityFilter === 'active' && (u.generationCount || 0) === 0) return false
            if (activityFilter === 'failed' && (u.failedCount || 0) === 0) return false

            return true
        })
        .sort((a, b) => {
            if (sortFilter === 'most_generations') {
                return (b.generationCount || 0) - (a.generationCount || 0)
            }
            if (sortFilter === 'recent_activity') {
                const aTime = a.lastGenerationAt ? new Date(a.lastGenerationAt).getTime() : 0
                const bTime = b.lastGenerationAt ? new Date(b.lastGenerationAt).getTime() : 0
                return bTime - aTime
            }
            if (sortFilter === 'pro_first') {
                const aScore = isProActive(a) ? 2 : a.plan === 'pro' ? 1 : 0
                const bScore = isProActive(b) ? 2 : b.plan === 'pro' ? 1 : 0
                if (aScore !== bScore) return bScore - aScore
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

    const total = filteredUsers.length
    const admins = filteredUsers.filter((u) => !!u.is_admin).length
    const activePros = filteredUsers.filter((u) => isProActive(u)).length
    const inactiveUsers = filteredUsers.filter((u) => (u.generationCount || 0) === 0).length

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">User management</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Segment users, monitor activity quality, and execute account actions safely.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    <UserCog size={14} />
                    Secure admin controls
                </div>
            </header>

            <section className="grid gap-4 md:grid-cols-4">
                <SummaryCard label="Filtered users" value={total} />
                <SummaryCard label="Active Pro" value={activePros} />
                <SummaryCard label="Admins" value={admins} />
                <SummaryCard label="No activity yet" value={inactiveUsers} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <form className="grid gap-3 lg:grid-cols-6">
                    <label className="relative lg:col-span-2">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={params.q || ''}
                            placeholder="Search by name, email, or user ID"
                            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                    </label>

                    <select
                        name="plan"
                        defaultValue={planFilter}
                        className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="all">All plans</option>
                        <option value="free">Free only</option>
                        <option value="pro">All Pro</option>
                        <option value="pro_active">Pro active</option>
                        <option value="pro_expired">Pro expired</option>
                    </select>

                    <select
                        name="role"
                        defaultValue={roleFilter}
                        className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="all">All roles</option>
                        <option value="admin">Admins</option>
                        <option value="user">Users</option>
                    </select>

                    <select
                        name="activity"
                        defaultValue={activityFilter}
                        className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="all">All activity</option>
                        <option value="active">Has activity</option>
                        <option value="inactive">No activity</option>
                        <option value="failed">Has failures</option>
                    </select>

                    <select
                        name="sort"
                        defaultValue={sortFilter}
                        className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="newest">Newest users</option>
                        <option value="most_generations">Most generations</option>
                        <option value="recent_activity">Most recent activity</option>
                        <option value="pro_first">Pro first</option>
                    </select>

                    <div className="flex items-center gap-2 lg:col-span-6">
                        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800">
                            <SlidersHorizontal size={14} />
                            Apply filters
                        </button>
                        <Link href="/admin/users" className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Reset
                        </Link>
                        <Link href="/admin/activity" className="ml-auto inline-flex h-10 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                            <Users size={14} />
                            Open activity feed
                        </Link>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">
                        Users list
                        <span className="ml-2 text-xs font-medium text-slate-500">({total} results)</span>
                    </p>
                    <p className="text-xs text-slate-500">Sorted by {sortFilter.replace('_', ' ')}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1060px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Resumes</th>
                                <th className="px-6 py-3">Last generation</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => (
                                <ClientUserRow key={u.id} user={u} showMonitoring currentAdminId={user.id} />
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                        No users match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
        </article>
    )
}
