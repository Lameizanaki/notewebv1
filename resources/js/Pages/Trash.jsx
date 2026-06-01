import Icon from '@/Components/Icon';
import SearchInput from '@/Components/SearchInput';
import SortDropdown from '@/Components/SortDropdown';
import TagPill from '@/Components/TagPill';
import AppLayout from '@/Layouts/AppLayout';
import { formatLocalDateTime } from '@/lib/dateTime';
import { useDebouncedSearch } from '@/lib/useDebouncedSearch';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function EmptyTrash({ message }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-5 py-9 text-center">
            <p className="text-sm text-slate-400">{message}</p>
        </div>
    );
}

function TrashNoteCard({ note, workspace = null }) {
    const canEdit = !workspace || workspace.can_edit;
    const restoreUrl = workspace
        ? route('workspaces.trash.restore', [workspace.id, note.id])
        : route('trash.restore', note.id);
    const destroyUrl = workspace
        ? route('workspaces.trash.destroy', [workspace.id, note.id])
        : route('trash.destroy', note.id);

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-white">{note.title}</h3>
                    <p className="mt-2 text-xs text-slate-400">Deleted on {formatLocalDateTime(note.deleted_at)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                        {note.days_remaining} day{note.days_remaining === 1 ? '' : 's'} remaining
                    </p>
                    {note.tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {note.tags.map((tag) => <TagPill key={tag.id} tag={tag} />)}
                        </div>
                    ) : null}
                </div>

                {canEdit ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => router.patch(restoreUrl)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                        >
                            <Icon name="fileText" className="h-3.5 w-3.5" />
                            Restore
                        </button>
                        <button
                            type="button"
                            onClick={() => router.delete(destroyUrl)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-500/40 px-3 text-xs text-rose-200 transition hover:border-rose-400 hover:text-white"
                        >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                            Delete Forever
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-slate-500">Read-only access</span>
                )}
            </div>
        </div>
    );
}

export default function Trash({ notes, workspaces, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'newest');

    const applyFilters = (next = {}) => {
        router.get(
            route('trash.index'),
            {
                search: next.search ?? search,
                sort: next.sort ?? sort,
            },
            { preserveState: true, replace: true },
        );
    };
    useDebouncedSearch(search, (value) => applyFilters({ search: value }));

    return (
        <AppLayout title="Trash">
            <Head title="Trash" />

            <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
                    <p className="mb-4 text-sm text-slate-400">Search personal and shared deleted notes. Notes are permanently removed after 30 days.</p>
                    <div className="flex flex-col gap-4 xl:flex-row">
                        <SearchInput value={search} onChange={setSearch} placeholder="Search all deleted notes..." />
                        <SortDropdown
                            value={sort}
                            onChange={(value) => {
                                setSort(value);
                                applyFilters({ sort: value });
                            }}
                        />
                    </div>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-2">
                    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Personal</p>
                            <h2 className="mt-2 text-lg font-semibold text-white">Your Deleted Notes</h2>
                        </div>
                        <div className="mt-4 space-y-3">
                            {notes.length
                                ? notes.map((note) => <TrashNoteCard key={note.id} note={note} />)
                                : <EmptyTrash message="Your personal trash is empty." />}
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Shared</p>
                            <h2 className="mt-2 text-lg font-semibold text-white">Workspace Deleted Notes</h2>
                        </div>
                        <div className="mt-4 space-y-4">
                            {workspaces.length ? workspaces.map((workspace) => (
                                <div key={workspace.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-semibold text-white">{workspace.name}</h3>
                                            <p className="mt-1 text-xs capitalize text-slate-500">{workspace.role} access</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={route('workspaces.notes.index', workspace.id)}
                                                className="inline-flex h-9 items-center rounded-lg border border-slate-700 px-3 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                                            >
                                                Open Workspace
                                            </Link>
                                            {workspace.is_owner ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete ${workspace.name} and permanently remove all of its shared notes?`)) {
                                                            router.delete(route('workspaces.destroy', workspace.id));
                                                        }
                                                    }}
                                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-500/40 px-3 text-xs text-rose-200 transition hover:border-rose-400 hover:text-white"
                                                >
                                                    <Icon name="trash" className="h-3.5 w-3.5" />
                                                    Delete Workspace
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {workspace.notes.length
                                            ? workspace.notes.map((note) => <TrashNoteCard key={note.id} note={note} workspace={workspace} />)
                                            : <EmptyTrash message="No deleted notes in this workspace." />}
                                    </div>
                                </div>
                            )) : <EmptyTrash message="You do not belong to any shared workspaces." />}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
