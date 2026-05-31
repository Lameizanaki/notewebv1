import Icon from '@/Components/Icon';
import SearchInput from '@/Components/SearchInput';
import SortDropdown from '@/Components/SortDropdown';
import TagPill from '@/Components/TagPill';
import AppLayout from '@/Layouts/AppLayout';
import { formatLocalDateTime } from '@/lib/dateTime';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Trash({ workspace, notes, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'newest');

    const applyFilters = (next = {}) => router.get(
        route('workspaces.trash.index', workspace.id),
        { search: next.search ?? search, sort: next.sort ?? sort },
        { preserveState: true, replace: true },
    );

    return (
        <AppLayout
            title={`${workspace.name} Trash`}
            actions={<Link href={route('workspaces.notes.index', workspace.id)} className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300">Back to Notes</Link>}
        >
            <Head title={`${workspace.name} Trash`} />
            <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
                    <div className="flex flex-col gap-4 xl:flex-row">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters({ search });
                            }}
                            placeholder="Search deleted shared notes..."
                        />
                        <SortDropdown value={sort} onChange={(value) => {
                            setSort(value);
                            applyFilters({ sort: value });
                        }} />
                    </div>
                </div>

                <div className="space-y-4">
                    {notes.length ? notes.map((note) => (
                        <div key={note.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{note.title}</h2>
                                    <p className="mt-2 text-sm text-slate-400">Deleted on {formatLocalDateTime(note.deleted_at)}</p>
                                    <p className="mt-1 text-sm text-slate-500">{note.days_remaining} days remaining before permanent deletion</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {note.tags.map((tag) => <TagPill key={tag.id} tag={tag} />)}
                                    </div>
                                </div>
                                {workspace.can_edit ? (
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => router.patch(route('workspaces.trash.restore', [workspace.id, note.id]))} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300">
                                            <Icon name="fileText" className="h-4 w-4" />
                                            Restore
                                        </button>
                                        <button type="button" onClick={() => router.delete(route('workspaces.trash.destroy', [workspace.id, note.id]))} className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 px-4 py-3 text-sm text-rose-200">
                                            <Icon name="trash" className="h-4 w-4" />
                                            Permanently Delete
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )) : (
                        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">Workspace trash is empty.</div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
