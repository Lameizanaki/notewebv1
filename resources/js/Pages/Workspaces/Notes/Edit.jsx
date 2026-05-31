import NoteEditor from '@/Components/NoteEditor';
import AppLayout from '@/Layouts/AppLayout';
import { useAutoSave } from '@/lib/useAutoSave';
import { workspaceNoteRoutes } from '@/lib/workspaceRoutes';
import { Head, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

export default function Edit({ workspace, note, tags, ocrUploads }) {
    const form = useForm({
        title: note.title ?? '',
        content: note.content ?? '',
        is_pinned: Boolean(note.is_pinned),
        tag_ids: note.tags.map((tag) => tag.id),
    });
    const formRef = useRef(form);
    formRef.current = form;
    const editorRef = useRef(null);

    const performSave = useCallback(async () => {
        const currentForm = formRef.current;
        let content = currentForm.data.content;

        if (editorRef.current?.serialize) {
            content = await editorRef.current.serialize();
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const response = await fetch(route('workspaces.notes.update', [workspace.id, note.id]), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ _method: 'PATCH', ...currentForm.data, content }),
        });

        if (!response.ok) {
            throw new Error('Auto-save failed.');
        }
    }, [note.id, workspace.id]);

    const { status, trigger, saveNow } = useAutoSave({ onSave: performSave, delay: 2000, enabled: true });

    useEffect(() => {
        const handleVisibilityChange = () => document.visibilityState === 'hidden' && saveNow();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [saveNow]);

    return (
        <AppLayout title={`Edit Note in ${workspace.name}`}>
            <Head title="Edit Shared Note" />
            <NoteEditor
                mode="edit"
                note={note}
                form={form}
                tags={tags}
                ocrUploads={ocrUploads}
                autoSaveStatus={status}
                onContentChange={trigger}
                editorRef={editorRef}
                routes={workspaceNoteRoutes(workspace.id)}
                submit={(content) => {
                    form.transform((data) => ({ ...data, content }));
                    form.patch(route('workspaces.notes.update', [workspace.id, note.id]));
                }}
            />
        </AppLayout>
    );
}
