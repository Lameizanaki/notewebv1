import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { app } = usePage().props;

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid lg:grid-cols-[1.1fr,0.9fr]">
                <div className="hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/40 lg:block">
                    <Link href="/" className="inline-flex items-center gap-3 text-slate-100">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 font-bold text-slate-950">
                            QN
                        </span>
                        <span>
                            <span className="block text-lg font-semibold">{app.name}</span>
                            <span className="block text-sm text-slate-400">{app.tagline}</span>
                        </span>
                    </Link>

                    <div className="mt-16 space-y-6">
                        <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
                            One place for class notes, ideas, and future smart tools.
                        </h1>
                        <p className="max-w-lg text-sm leading-7 text-slate-400">
                            QuickNote is set up with Laravel, React, Inertia, and Breeze. The design is intentionally
                            lightweight for now so we can restyle it cleanly against your upcoming Stitch or Figma
                            screens.
                        </p>
                    </div>
                </div>

                <div className="w-full">
                    <div className="mb-6 lg:hidden">
                        <Link href="/" className="inline-flex items-center gap-3 text-slate-100">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 font-bold text-slate-950">
                                QN
                            </span>
                            <span>
                                <span className="block text-base font-semibold">{app.name}</span>
                                <span className="block text-sm text-slate-400">{app.tagline}</span>
                            </span>
                        </Link>
                    </div>

                    <div className="w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
