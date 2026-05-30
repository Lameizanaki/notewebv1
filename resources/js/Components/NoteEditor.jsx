import ConfirmDialog from '@/Components/ConfirmDialog';
import Icon from '@/Components/Icon';
import OcrUploadModal from '@/Components/OcrUploadModal';
import PlateNoteEditor from '@/Components/PlateNoteEditor';
import TagManagementModal from '@/Components/TagManagementModal';
import TagPill from '@/Components/TagPill';
import TagSelector from '@/Components/TagSelector';
import { Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function NoteEditor({
    form,
    submit,
    tags = [],
    ocrUploads = [],
    note = null,
    mode = 'create',
    readOnly = false,
    autoSaveStatus = '',
    onContentChange = null,
    editorRef: externalEditorRef = null,
}) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showOcrModal, setShowOcrModal] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [saveError, setSaveError] = useState('');
    const internalEditorRef = useRef(null);
    const editorRef = externalEditorRef ?? internalEditorRef;

    const selectedTagIds = form.data.tag_ids ?? [];

    const toggleTag = (tagId) => {
        const next = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter((item) => item !== tagId)
            : [...selectedTagIds, tagId];

        form.setData('tag_ids', next);
        onContentChange?.();
    };

    return (
        <>
            <form
                onSubmit={async (event) => {
                    event.preventDefault();

                    if (readOnly) {
                        return;
                    }

                    setSaveError('');

                    try {
                        editorRef.current?.stopDictation?.();
                        const content = await editorRef.current?.serialize();
                        submit(content);
                    } catch (error) {
                        setSaveError(error.message || 'The note could not be saved. Please try again.');
                    }
                }}
                className="space-y-6"
            >
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="w-full">
                            <label className="text-sm font-medium text-slate-300">Title</label>
                            <input
                                type="text"
                                value={form.data.title}
                                onChange={(event) => {
                                    form.setData('title', event.target.value);
                                    onContentChange?.();
                                }}
                                disabled={readOnly}
                                placeholder="Lecture summary, meeting notes, project ideas..."
                                className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-lg font-semibold text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
                            />
                            {form.errors.title ? <p className="mt-2 text-sm text-rose-300">{form.errors.title}</p> : null}
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-2 lg:w-32 lg:flex-col lg:items-stretch lg:pt-7">
                            {readOnly && note ? (
                                <Link
                                    href={route('notes.edit', note.id)}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                                >
                                    <Icon name="fileText" className="h-4 w-4" />
                                    Edit Note
                                </Link>
                            ) : null}
                            {!readOnly ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.setData('is_pinned', !form.data.is_pinned);
                                        onContentChange?.();
                                    }}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                                >
                                    <Icon name="pin" className="h-4 w-4" />
                                    {form.data.is_pinned ? 'Unpin' : 'Pin'}
                                </button>
                            ) : null}
                            {note && !readOnly ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-500/40 px-3 text-sm text-rose-200 transition hover:border-rose-400 hover:text-white"
                                >
                                    <Icon name="trash" className="h-4 w-4" />
                                    Delete
                                </button>
                            ) : null}
                            {!readOnly && mode === 'create' ? (
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Icon name="save" className="h-4 w-4" />
                                    Save Note
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {!readOnly ? (
                        <div className="mt-6">
                            <TagSelector
                                tags={tags}
                                selectedTagIds={selectedTagIds}
                                onChange={toggleTag}
                                onManage={() => setShowTagManager(true)}
                            />
                            {form.errors.tag_ids ? <p className="mt-2 text-sm text-rose-300">{form.errors.tag_ids}</p> : null}
                        </div>
                    ) : null}

                    <div className="mt-6">
                        <label className="text-sm font-medium text-slate-300">Content</label>
                        {saveError ? (
                            <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                                {saveError}
                            </p>
                        ) : null}
                        <PlateNoteEditor
                            ref={editorRef}
                            value={form.data.content}
                            readOnly={readOnly}
                            placeholder="Write your note here..."
                            onOpenOcr={() => setShowOcrModal(true)}
                            onContentChange={onContentChange}
                        />
                        {form.errors.content ? <p className="mt-2 text-sm text-rose-300">{form.errors.content}</p> : null}
                    </div>
                </div>

                {note?.tags?.length ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Attached Tags</h3>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {note.tags.map((tag) => (
                                <TagPill key={tag.id} tag={tag} />
                            ))}
                        </div>
                    </div>
                ) : null}
            </form>

            <OcrUploadModal
                open={showOcrModal}
                onClose={() => setShowOcrModal(false)}
                noteId={note?.id ?? null}
                uploads={ocrUploads}
                onInsertText={(value) => {
                    editorRef.current?.appendText(value);
                    setShowOcrModal(false);
                }}
            />

            <TagManagementModal open={showTagManager} onClose={() => setShowTagManager(false)} tags={tags} />

            <ConfirmDialog
                open={showDeleteDialog}
                title="Move note to trash?"
                message="This note will stay in trash for 30 days before permanent deletion."
                confirmLabel="Move to Trash"
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={() => router.delete(route('notes.destroy', note.id))}
            />
        </>
    );
}
