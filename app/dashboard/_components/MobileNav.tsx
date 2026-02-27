'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    CreditCard,
    Menu,
    X,
    LogOut,
    Crown,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { SITE_NAME } from '@/lib/config'

interface MobileNavProps {
    isPro: boolean
    userName: string
    userEmail: string
    avatarUrl: string | null
}

export function MobileNav({ isPro, userName, userEmail, avatarUrl }: MobileNavProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* ── Mobile Top Bar ────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3">
                <Link href="/" className="flex items-center gap-2">
                    <Logo size={32} />
                    <span className="text-lg font-bold text-slate-900">{SITE_NAME}</span>
                </Link>

                <button
                    onClick={() => setOpen(!open)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                    aria-label="Toggle menu"
                >
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </header>

            {/* ── Slide-down Sheet ──────────────────────────────── */}
            {open && (
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                    <nav
                        className="absolute top-[57px] left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 space-y-1 animate-slide-down"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* User info */}
                        <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-500 font-bold text-sm">{userEmail?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                                <p className="text-xs text-slate-500 truncate">{isPro ? 'Pro Member' : 'Free Plan'}</p>
                            </div>
                            {isPro && (
                                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    <Crown size={10} /> PRO
                                </span>
                            )}
                        </div>

                        <Link
                            href="/dashboard"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                        >
                            <LayoutDashboard size={20} /> Home
                        </Link>

                        <Link
                            href="/dashboard/generate"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-teal-700 bg-teal-50 border border-teal-200 rounded-xl font-bold"
                        >
                            <PlusCircle size={20} /> New Resume
                        </Link>

                        {isPro ? (
                            <Link
                                href="/dashboard/cover-letter"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                            >
                                <FileText size={20} /> Cover Letters
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3 px-4 py-3 text-slate-300 cursor-not-allowed select-none">
                                <FileText size={20} />
                                <span className="font-medium">Cover Letters</span>
                                <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">PRO</span>
                            </div>
                        )}

                        <Link
                            href="/dashboard/billing"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                        >
                            <CreditCard size={20} /> Subscription
                        </Link>

                        <div className="border-t border-slate-100 pt-2 mt-2">
                            <form action="/auth/signout" method="post">
                                <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-500 hover:text-red-600 transition rounded-xl hover:bg-red-50">
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </form>
                        </div>
                    </nav>
                </div>
            )}

            {/* ── Bottom Quick-Action Bar ──────────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="flex items-center justify-around px-2 py-1.5">
                    <Link href="/dashboard" className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-slate-500 hover:text-teal-600 transition">
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-semibold">Home</span>
                    </Link>
                    <Link href="/dashboard/generate" className="flex flex-col items-center gap-0.5 px-3 py-1.5 -mt-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                            <PlusCircle size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-teal-600">Create</span>
                    </Link>
                    <Link href="/dashboard/billing" className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-slate-500 hover:text-teal-600 transition">
                        <CreditCard size={20} />
                        <span className="text-[10px] font-semibold">Plan</span>
                    </Link>
                </div>
            </nav>
        </>
    )
}
