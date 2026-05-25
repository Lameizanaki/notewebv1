import NoteEditor from '@/Components/NoteEditor';
import AppLayout from '@/Layouts/AppLayout';
import { useAutoSave } from '@/lib/useAutoSave';
import { Head, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

export default function Edit({ note, tags, ocrUploads }) {
    const form = useForm({
        title: note.title ?? '',
        content: note.content ?? '',
        is_pinned: Boolean(note.is_pinned),
        tag_ids: note.tags.map((tag) => tag.id),
    });

    // Keep a ref to the latest form data so the auto-save closure always
    // reads the freshest values without needing form in the dependency array.
    const formRef = useRef(form);
    formRef.current = form;

    // Ref forwarded into NoteEditor → PlateNoteEditor so we can call serialize()
    const editorRef = useRef(null);

    const performSave = useCallback(async () => {
        const currentForm = formRef.current;

        // Serialize the latest rich-text content from the Plate editor
        let content = currentForm.data.content;
        if (editorRef.current?.serialize) {
            try {
                content = await editorRef.current.serialize();
            } catch {
                // fall back to last known form data content
            }
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const response = await fetch(route('notes.update', note.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                _method: 'PATCH',
                title: currentForm.data.title,
                content,
                is_pinned: currentForm.data.is_pinned,
                tag_ids: currentForm.data.tag_ids,
            }),
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || 'Auto-save failed.');
        }
    }, [note.id]);

    const { status: autoSaveStatus, trigger: triggerAutoSave, saveNow } = useAutoSave({
        onSave: performSave,
        delay: 2000,
        enabled: true,
    });

    // Flush any pending auto-save when the user switches tabs or closes the page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveNow();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [saveNow]);

    return (
        <AppLayout title="Edit Note">
            <Head title="Edit Note" />

            <NoteEditor
                mode="edit"
                note={note}
                form={form}
                tags={tags}
                ocrUploads={ocrUploads}
                autoSaveStatus={autoSaveStatus}
                onContentChange={triggerAutoSave}
                editorRef={editorRef}
                submit={(content) => {
                    form.transform((data) => ({
                        ...data,
                        content,
                    }));

                    form.patch(route('notes.update', note.id));
                }}
            />
        </AppLayout>
    );
}
