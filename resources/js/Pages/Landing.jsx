import { Head, Link, usePage } from '@inertiajs/react';

export default function Landing({ canLogin, canRegister }) {
    const { app } = usePage().props;

    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
                <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 sm:p-10">
                    <div className="flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">QuickNote</p>
                            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">{app.tagline}</h1>
                        </div>
                        <div className="flex gap-3">
                            {canLogin ? (
                                <Link
                                    href={route('login')}
                                    className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                                >
                                    Login
                                </Link>
                            ) : null}
                            {canRegister ? (
                                <Link
                                    href={route('register')}
                                    className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                                >
                                    Register
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8">
                            <h2 className="text-2xl font-semibold text-white">Built for a clean setup first</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                                This initial QuickNote foundation focuses on authentication, CRUD notes, search, tag filters, pinned notes, trash recovery, profile settings, and placeholder AI tooling. The visual layer stays intentionally simple so it can be restyled cleanly later.
                            </p>
                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                {[
                                    'Laravel + React + Inertia',
                                    'Breeze auth and email verification',
                                    'Pinned, tagged, searchable notes',
                                    'OCR, dictation, and auto-formatting placeholders',
                                ].map((item) => (
                                    <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-emerald-400/10 via-slate-950 to-slate-950 p-8">
                            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Starter scope</p>
                            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                                <li>Notes can be created, edited, pinned, filtered by tag, searched by title, and sorted by date.</li>
                                <li>Deleted notes move to trash, can be restored, and are marked for purge after 30 days.</li>
                                <li>OCR uploads, dictation, and auto-formatting hooks are ready for future feature work.</li>
                            </ul>

                            <Link
                                href={canRegister ? route('register') : route('login')}
                                className="mt-8 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                            >
                                Start with QuickNote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
