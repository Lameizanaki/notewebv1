import NoteEditor from '@/Components/NoteEditor';
import AppLayout from '@/Layouts/AppLayout';
import { workspaceNoteRoutes } from '@/lib/workspaceRoutes';
import { Head, useForm } from '@inertiajs/react';

export default function Create({ workspace, tags, ocrUploads }) {
    const form = useForm({
        title: '',
        content: '<h2>Heading</h2><p></p>',
        is_pinned: false,
        tag_ids: [],
    });

    return (
        <AppLayout title={`Create Note in ${workspace.name}`}>
            <Head title="Create Shared Note" />
            <NoteEditor
                mode="create"
                form={form}
                tags={tags}
                ocrUploads={ocrUploads}
                routes={workspaceNoteRoutes(workspace.id)}
                submit={(content) => {
                    form.transform((data) => ({ ...data, content }));
                    form.post(route('workspaces.notes.store', workspace.id));
                }}
            />
        </AppLayout>
    );
}
