import NoteEditor from '@/Components/NoteEditor';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Create({ tags, ocrUploads }) {
    const form = useForm({
        title: '',
        content: '<h2>Heading</h2><p></p>',
        is_pinned: false,
        tag_ids: [],
    });

    return (
        <AppLayout title="Create Note">
            <Head title="Create Note" />

            <NoteEditor
                mode="create"
                form={form}
                tags={tags}
                ocrUploads={ocrUploads}
                submit={(content) => {
                    form.transform((data) => ({
                        ...data,
                        content,
                    }));

                    form.post(route('notes.store'));
                }}
            />
        </AppLayout>
    );
}
