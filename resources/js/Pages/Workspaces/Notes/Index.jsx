import FilterDropdown from '@/Components/FilterDropdown';
import Icon from '@/Components/Icon';
import NoteList from '@/Components/NoteList';
import SearchInput from '@/Components/SearchInput';
import SortDropdown from '@/Components/SortDropdown';
import AppLayout from '@/Layouts/AppLayout';
import { useDebouncedSearch } from '@/lib/useDebouncedSearch';
import { workspaceNoteRoutes } from '@/lib/workspaceRoutes';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ workspace, notes, tags, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [tag, setTag] = useState(filters.tag ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'newest');
    const noteRoutes = workspaceNoteRoutes(workspace.id, workspace.can_edit);

    const applyFilters = (next = {}) => {
        router.get(
            route('workspaces.notes.index', workspace.id),
            {
                search: next.search ?? search,
                tag: next.tag ?? tag,
                sort: next.sort ?? sort,
            },
            { preserveState: true, replace: true },
        );
    };
    useDebouncedSearch(search, (value) => applyFilters({ search: value }));

    return (
        <AppLayout
            title={workspace.name}
            actions={
                <div className="flex flex-wrap gap-2">
                    <Link href={route('workspaces.settings.edit', workspace.id)} className="inline-flex h-10 items-center rounded-lg border border-slate-700 px-4 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white">
                        Members
                    </Link>
                    {workspace.can_edit ? (
                        <Link href={route('workspaces.notes.create', workspace.id)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
                            <Icon name="plus" className="h-4 w-4" />
                            New Shared Note
                        </Link>
                    ) : null}
                </div>
            }
        >
            <Head title={workspace.name} />

            <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
                    <p className="mb-4 text-sm text-slate-400">
                        {workspace.description || `You have ${workspace.role} access to this shared workspace.`}
                    </p>
                    <div className="flex flex-col gap-4 xl:flex-row">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search shared notes by title..."
                        />
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <FilterDropdown
                                value={tag}
                                options={tags}
                                onChange={(value) => {
                                    setTag(value);
                                    applyFilters({ tag: value });
                                }}
                            />
                            <SortDropdown
                                value={sort}
                                onChange={(value) => {
                                    setSort(value);
                                    applyFilters({ sort: value });
                                }}
                            />
                        </div>
                    </div>
                </div>

                <NoteList
                    notes={notes}
                    routes={noteRoutes}
                    allowActions={workspace.can_edit}
                    createHref={workspace.can_edit ? route('workspaces.notes.create', workspace.id) : null}
                    emptyTitle="No shared notes yet"
                    emptyDescription={workspace.can_edit ? 'Create the first shared note for this workspace.' : 'An editor has not added any shared notes yet.'}
                />
            </div>
        </AppLayout>
    );
}
