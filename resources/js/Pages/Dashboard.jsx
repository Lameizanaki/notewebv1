import NoteList from '@/Components/NoteList';
import Icon from '@/Components/Icon';
import SearchInput from '@/Components/SearchInput';
import AppLayout from '@/Layouts/AppLayout';
import { useDebouncedSearch } from '@/lib/useDebouncedSearch';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard({ filters, pinnedNotes, recentNotes }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const { auth } = usePage().props;
    const hasNotes = pinnedNotes.length || recentNotes.length;

    useDebouncedSearch(search, (value) => {
        router.get(route('dashboard'), { search: value }, { preserveState: true, replace: true });
    });

    return (
        <AppLayout
            title={`Welcome back, ${auth.user.name}`}
            actions={
                <Link
                    href={route('notes.create')}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                    <Icon name="plus" className="h-4 w-4" />
                    Create Note
                </Link>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
                    <p className="mb-4 text-sm text-slate-400">Search notes by title across your QuickNote workspace.</p>
                    <SearchInput value={search} onChange={setSearch} />
                </div>

                {!hasNotes ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
                        <h2 className="text-2xl font-semibold text-white">Create your first note</h2>
                        <p className="mt-3 text-sm text-slate-400">Your pinned and recent notes will appear here after the first save.</p>
                        <Link
                            href={route('notes.create')}
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                        >
                            <Icon name="plus" className="h-4 w-4" />
                            Create your first note
                        </Link>
                    </div>
                ) : null}

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Pinned Notes</h2>
                        <Link href={route('notes.pinned')} className="text-sm text-slate-400 transition hover:text-white">
                            View all pinned
                        </Link>
                    </div>
                    <NoteList
                        notes={pinnedNotes}
                        variant="card"
                        emptyTitle="No pinned notes yet"
                        emptyDescription="Pin important notes to keep them at the top of your workspace."
                    />
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Recent Notes</h2>
                    <NoteList
                        notes={recentNotes}
                        emptyTitle="No recent notes yet"
                        emptyDescription="Create your first note and it will show up here."
                    />
                </section>
            </div>
        </AppLayout>
    );
}
