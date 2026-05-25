import NoteEditor from '@/Components/NoteEditor';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Show({ note, tags, ocrUploads }) {
    const form = useForm({
        title: note.title ?? '',
        content: note.content ?? '',
        is_pinned: Boolean(note.is_pinned),
        tag_ids: note.tags.map((tag) => tag.id),
    });

    return (
        <AppLayout
            title="View Note"
            actions={
                <Link
                    href={route('notes.edit', note.id)}
                    className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                    Edit Note
                </Link>
            }
        >
            <Head title={note.title} />

            <NoteEditor readOnly note={note} form={form} tags={tags} ocrUploads={ocrUploads} />
        </AppLayout>
    );
}
