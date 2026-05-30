import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';

const links = [
    { label: 'Dashboard', href: 'dashboard', icon: 'home' },
    { label: 'All Notes', href: 'notes.index', icon: 'fileText' },
    { label: 'Pinned', href: 'notes.pinned', icon: 'pin' },
    { label: 'Trash', href: 'trash.index', icon: 'trash' },
    { label: 'Settings', href: 'settings.edit', icon: 'text' },
];

export default function Sidebar({ user, className = '', onClose = null, showMobileClose = false }) {
    const page = usePage();
    const { app } = page.props;
    const currentUrl = page.url ?? '';

    return (
        <aside
            className={`flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl shadow-slate-950/40 ${className}`}
        >
            <div className="flex items-start justify-between gap-3">
                <Link href={route('dashboard')} className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-lg font-semibold text-white">{app.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{app.tagline}</p>
                </Link>

                {showMobileClose ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/70 text-slate-300 transition hover:border-slate-500 hover:text-white"
                        aria-label="Close sidebar"
                    >
                        <Icon name="x" className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            <Link
                href={route('notes.create')}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
                <Icon name="plus" className="h-4 w-4" />
                New Note
            </Link>

            <nav className="mt-6 space-y-2">
                {links.map((item) => {
                    const href = route(item.href);
                    const pathname = new URL(href, 'http://quicknote.test').pathname;
                    const active = currentUrl === pathname || currentUrl.startsWith(`${pathname}?`);

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            onClick={onClose ?? undefined}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                                active
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                            }`}
                        >
                            <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-3">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="h-11 w-11 rounded-lg object-cover" />
                    ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-white">
                            {user?.name?.slice(0, 2)?.toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                        <p className="truncate text-xs text-slate-400">{user?.email}</p>
                    </div>
                </div>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    onClick={onClose ?? undefined}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                    <Icon name="logOut" className="h-4 w-4" />
                    Log out
                </Link>
            </div>
        </aside>
    );
}
