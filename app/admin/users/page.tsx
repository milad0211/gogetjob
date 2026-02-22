import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientUserRow } from '@/app/admin/_components/ClientUserRow'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    // Admin Check
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return redirect('/dashboard')

    // Fetch All Users
    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: activities } = await supabase
        .from('resume_generations')
        .select('user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20000)

    const activityByUser = new Map<string, { count: number; lastGenerationAt: string | null }>()
    for (const row of activities || []) {
        const prev = activityByUser.get(row.user_id)
        if (!prev) {
            activityByUser.set(row.user_id, { count: 1, lastGenerationAt: row.created_at })
            continue
        }
        prev.count += 1
    }

    const usersWithStats = (users || []).map((u) => {
        const stat = activityByUser.get(u.id)
        return {
            ...u,
            generationCount: u.total_generations_used ?? stat?.count ?? 0,
            lastGenerationAt: stat?.lastGenerationAt || null,
        }
    })

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                <p className="text-slate-500 mt-1">View, edit, monitor plans, and track resume generation activity per user.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Resumes</th>
                                <th className="px-6 py-3">Last Generation</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {usersWithStats.map((u) => (
                                <ClientUserRow key={u.id} user={u} showMonitoring />
                            ))}
                            {usersWithStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
