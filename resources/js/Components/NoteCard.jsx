import ConfirmDialog from '@/Components/ConfirmDialog';
import TagPill from '@/Components/TagPill';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function NoteCard({ note }) {
    const [showDelete, setShowDelete] = useState(false);

    return (
        <>
            <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <Link href={route('notes.edit', note.id)} className="text-lg font-semibold text-white transition hover:text-emerald-300">
                            {note.title}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{note.preview || 'No content yet.'}</p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={() => router.patch(route('notes.pin', note.id), {}, { preserveScroll: true })}
                            className="rounded-2xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                        >
                            {note.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowDelete(true)}
                            className="rounded-2xl border border-rose-500/40 px-3 py-2 text-xs text-rose-200 transition hover:border-rose-400 hover:text-white"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                    ))}
                </div>

                <div className="mt-5 text-xs text-slate-500">
                    <span>Last edited {note.updated_at}</span>
                </div>
            </article>

            <ConfirmDialog
                open={showDelete}
                title="Move note to trash?"
                message="This note will stay in trash for 30 days before permanent deletion."
                confirmLabel="Move to Trash"
                onClose={() => setShowDelete(false)}
                onConfirm={() => router.delete(route('notes.destroy', note.id))}
            />
        </>
    );
}
