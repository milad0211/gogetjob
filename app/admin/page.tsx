import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, FileText, DollarSign, Activity, Settings } from 'lucide-react'
import { ClientUserRow } from './_components/ClientUserRow'

export default async function AdminPage() {
    const supabase = await createClient()

    // Auth check is handled in layout, but double check doesn't hurt
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: genCount } = await supabase.from('resume_generations').select('*', { count: 'exact', head: true })
    const { count: proCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro')

    const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">System metrics and recent user activity.</p>
                </div>
                <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">
                    <Settings size={16} /> Settings
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Total Users" value={userCount || 0} color="bg-blue-500" />
                <StatCard icon={FileText} label="Total Resumes" value={genCount || 0} color="bg-purple-500" />
                <StatCard icon={DollarSign} label="Pro Subscribers" value={proCount || 0} color="bg-green-500" />
                <StatCard icon={Activity} label="System Status" value="Healthy" color="bg-emerald-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-900">Recent Users</h2>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Last 10 joined</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentUsers?.map((u) => (
                                <ClientUserRow key={u.id} user={u} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 transition hover:shadow-md">
            <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white shadow-lg opacity-90`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    )
}
