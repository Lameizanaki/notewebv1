import Icon from '@/Components/Icon';
import NoteEditor from '@/Components/NoteEditor';
import AppLayout from '@/Layouts/AppLayout';
import { useWorkspaceNotePolling } from '@/lib/useWorkspaceNotePolling';
import { workspaceNoteRoutes } from '@/lib/workspaceRoutes';
import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';

export default function Show({ workspace, note, tags, ocrUploads }) {
    const form = useForm({
        title: note.title ?? '',
        content: note.content ?? '',
        is_pinned: Boolean(note.is_pinned),
        tag_ids: note.tags.map((tag) => tag.id),
    });
    const formRef = useRef(form);
    formRef.current = form;
    const editorRef = useRef(null);
    const [currentNote, setCurrentNote] = useState(note);

    const applyRemoteSnapshot = useCallback((snapshot) => {
        formRef.current.setData({
            title: snapshot.title ?? '',
            content: snapshot.content ?? '',
            is_pinned: Boolean(snapshot.is_pinned),
            tag_ids: snapshot.tags.map((tag) => tag.id),
        });
        editorRef.current?.replaceContent?.(snapshot.content ?? '');
        setCurrentNote((existingNote) => ({ ...existingNote, ...snapshot }));
    }, []);

    useWorkspaceNotePolling({
        workspaceId: workspace.id,
        noteId: note.id,
        initialVersion: note.sync_version,
        onSnapshot: applyRemoteSnapshot,
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
            <Head title={currentNote.title} />
            <NoteEditor
                readOnly
                note={currentNote}
                form={form}
                tags={tags}
                ocrUploads={ocrUploads}
                editorRef={editorRef}
                routes={workspaceNoteRoutes(workspace.id)}
                showEditAction={workspace.can_edit}
            />
        </AppLayout>
    );
}
