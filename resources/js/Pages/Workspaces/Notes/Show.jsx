import Icon from '@/Components/Icon';
import NoteEditor from '@/Components/NoteEditor';
import AppLayout from '@/Layouts/AppLayout';
import { workspaceNoteRoutes } from '@/lib/workspaceRoutes';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Show({ workspace, note, tags, ocrUploads }) {
    const form = useForm({
        title: note.title ?? '',
        content: note.content ?? '',
        is_pinned: Boolean(note.is_pinned),
        tag_ids: note.tags.map((tag) => tag.id),
    });

    return (
        <AppLayout
            title={`View Note in ${workspace.name}`}
            actions={workspace.can_edit ? (
                <Link href={route('workspaces.notes.edit', [workspace.id, note.id])} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950">
                    <Icon name="fileText" className="h-4 w-4" />
                    Edit Note
                </Link>
            ) : null}
        >
            <Head title={note.title} />
            <NoteEditor
                readOnly
                note={note}
                form={form}
                tags={tags}
                ocrUploads={ocrUploads}
                routes={workspaceNoteRoutes(workspace.id)}
                showEditAction={workspace.can_edit}
            />
        </AppLayout>
    );
}
