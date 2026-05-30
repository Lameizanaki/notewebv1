import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Icon from '@/Components/Icon';

export default function TagManagementModal({ open, onClose, tags = [] }) {
    const createForm = useForm({ name: '' });
    const [drafts, setDrafts] = useState({});

    const tagDrafts = useMemo(
        () =>
            tags.reduce((accumulator, tag) => {
                accumulator[tag.id] = drafts[tag.id] ?? tag.name;
                return accumulator;
            }, {}),
        [drafts, tags],
    );

    if (!open) {
        return null;
    }

    const renameTag = (tagId) => {
        router.patch(
            route('tags.update', tagId),
            { name: tagDrafts[tagId] },
            { preserveScroll: true },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Manage Tags</h3>
                        <p className="mt-2 text-sm text-slate-400">Create, rename, or delete note tags.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
                        aria-label="Close tag manager"
                    >
                        <Icon name="x" className="h-4 w-4" />
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        createForm.post(route('tags.store'), {
                            preserveScroll: true,
                            onSuccess: () => createForm.reset('name'),
                        });
                    }}
                    className="mt-6 flex flex-col gap-3 sm:flex-row"
                >
                    <input
                        type="text"
                        value={createForm.data.name}
                        onChange={(event) => createForm.setData('name', event.target.value)}
                        placeholder="New tag name"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-0"
                    />
                    <button
                        type="submit"
                        disabled={createForm.processing}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Icon name="plus" className="h-4 w-4" />
                        Add Tag
                    </button>
                </form>
                {createForm.errors.name ? <p className="mt-2 text-sm text-rose-300">{createForm.errors.name}</p> : null}

                <div className="mt-6 space-y-3">
                    {tags.length ? (
                        tags.map((tag) => (
                            <div
                                key={tag.id}
                                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 md:flex-row md:items-center"
                            >
                                <input
                                    type="text"
                                    value={tagDrafts[tag.id]}
                                    onChange={(event) =>
                                        setDrafts((current) => ({
                                            ...current,
                                            [tag.id]: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-0"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => renameTag(tag.id)}
                                        className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                                    >
                                        Rename
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.delete(route('tags.destroy', tag.id), { preserveScroll: true })}
                                        className="rounded-lg border border-rose-500/40 px-4 py-3 text-sm text-rose-200 transition hover:border-rose-400 hover:text-white"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
                            No tags created yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
