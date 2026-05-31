import ConfirmDialog from '@/Components/ConfirmDialog';
import Icon from '@/Components/Icon';
import TagPill from '@/Components/TagPill';
import { formatLocalDateTime } from '@/lib/dateTime';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function NoteCard({ note, routes = {}, allowActions = true }) {
    const [showDelete, setShowDelete] = useState(false);
    const editUrl = routes.edit?.(note.id) ?? route('notes.edit', note.id);
    const pinUrl = routes.pin?.(note.id) ?? route('notes.pin', note.id);
    const destroyUrl = routes.destroy?.(note.id) ?? route('notes.destroy', note.id);
    const openNote = () => router.visit(editUrl);

    return (
        <>
            <article
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
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <Link
                            href={editUrl}
                            onClick={(event) => event.stopPropagation()}
                            className="text-lg font-semibold text-white transition hover:text-emerald-300"
                        >
                            {note.title}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{note.preview || 'No content yet.'}</p>
                    </div>

                    {allowActions ? <div className="flex shrink-0 gap-1.5" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => router.patch(pinUrl, {}, { preserveScroll: true })}
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
                    </div> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                    ))}
                </div>

                <div className="mt-5 text-xs text-slate-500">
                    <span>Last edited {formatLocalDateTime(note.updated_at)}</span>
                </div>
            </article>

            <ConfirmDialog
                open={showDelete}
                title="Move note to trash?"
                message="This note will stay in trash for 30 days before permanent deletion."
                confirmLabel="Move to Trash"
                onClose={() => setShowDelete(false)}
                onConfirm={() => router.delete(destroyUrl)}
            />
        </>
    );
}
