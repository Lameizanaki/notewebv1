import TagPill from '@/Components/TagPill';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';

export default function Trash({ notes }) {
    return (
        <AppLayout title="Trash">
            <Head title="Trash" />

            <div className="space-y-4">
                {notes.length ? (
                    notes.map((note) => (
                        <div key={note.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{note.title}</h2>
                                    <p className="mt-2 text-sm text-slate-400">Deleted on {note.deleted_at}</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {note.days_remaining} day{note.days_remaining === 1 ? '' : 's'} remaining before permanent deletion
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {note.tags.map((tag) => (
                                            <TagPill key={tag.id} tag={tag} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => router.patch(route('trash.restore', note.id))}
                                        className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                                    >
                                        Restore
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.delete(route('trash.destroy', note.id))}
                                        className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm text-rose-200 transition hover:border-rose-400 hover:text-white"
                                    >
                                        Permanently Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
                        <h2 className="text-2xl font-semibold text-white">Trash is empty</h2>
                        <p className="mt-3 text-sm text-slate-400">Deleted notes will appear here until they are restored or permanently removed.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
