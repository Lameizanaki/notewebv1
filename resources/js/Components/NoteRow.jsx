import ConfirmDialog from '@/Components/ConfirmDialog';
import Icon from '@/Components/Icon';
import TagPill from '@/Components/TagPill';
import { formatLocalDateTime } from '@/lib/dateTime';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function NoteRow({ note }) {
    const [showDelete, setShowDelete] = useState(false);
    const openNote = () => router.visit(route('notes.edit', note.id));

    return (
        <>
            <div
                role="link"
                tabIndex={0}
                onClick={openNote}
                onKeyDown={(event) => {
                    if (event.currentTarget === event.target && event.key === 'Enter') {
                        openNote();
                    }
                }}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30 transition hover:border-slate-700"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={route('notes.edit', note.id)}
                                onClick={(event) => event.stopPropagation()}
                                className="text-lg font-semibold text-white transition hover:text-emerald-300"
                            >
                                {note.title}
                            </Link>
                            {note.is_pinned ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200">
                                    <Icon name="pin" className="h-3 w-3" />
                                    Pinned
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{note.preview || 'No content yet.'}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {note.tags.map((tag) => (
                                <TagPill key={tag.id} tag={tag} />
                            ))}
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-1.5 lg:w-52 lg:justify-end" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => router.patch(route('notes.pin', note.id), {}, { preserveScroll: true })}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                        >
                            <Icon name="pin" className="h-3.5 w-3.5" />
                            {note.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowDelete(true)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/40 px-2.5 text-xs text-rose-200 transition hover:border-rose-400 hover:text-white"
                        >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                            Delete
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">Last edited {formatLocalDateTime(note.updated_at)}</div>
            </div>

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
