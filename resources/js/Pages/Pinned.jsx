import FilterDropdown from '@/Components/FilterDropdown';
import NoteList from '@/Components/NoteList';
import SearchInput from '@/Components/SearchInput';
import SortDropdown from '@/Components/SortDropdown';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Pinned({ notes, tags, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [tag, setTag] = useState(filters.tag ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'newest');

    const applyFilters = (next = {}) => {
        router.get(
            route('notes.pinned'),
            {
                search: next.search ?? search,
                tag: next.tag ?? tag,
                sort: next.sort ?? sort,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout title="Pinned Notes">
            <Head title="Pinned Notes" />

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
                    emptyTitle="No pinned notes"
                    emptyDescription="Pin your most important notes to keep them easy to reach."
                />
            </div>
        </AppLayout>
    );
}
