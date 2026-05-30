import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Icon from '@/Components/Icon';

export default function OcrUploadModal({ open, onClose, noteId = null, uploads = [], onInsertText }) {
    const form = useForm({
        note_id: noteId ?? '',
        file: null,
    });
    const [uploadError, setUploadError] = useState('');
    const latestUpload = uploads[0] ?? null;

    useEffect(() => {
        form.setData('note_id', noteId ?? '');
    }, [noteId]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">OCR Upload</h3>
                        <p className="mt-2 text-sm text-slate-400">
                            Upload PNG, JPG, or PDF files to extract text and insert it into your note.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
                        aria-label="Close OCR modal"
                    >
                        <Icon name="x" className="h-4 w-4" />
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('ocr-uploads.store'), {
                            preserveScroll: true,
                            forceFormData: true,
                            onStart: () => setUploadError(''),
                            onSuccess: () => form.reset('file'),
                            onError: () => setUploadError('OCR upload failed. Please try a smaller PNG or JPG.'),
                            onFinish: () => form.clearErrors(),
                        });
                    }}
                    className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                    <label className="block text-sm font-medium text-white">Upload file</label>
                    <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)}
                        className="mt-3 block w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                    />
                    {form.errors.file ? <p className="mt-2 text-sm text-rose-300">{form.errors.file}</p> : null}
                    {uploadError ? <p className="mt-2 text-sm text-rose-300">{uploadError}</p> : null}

                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Icon name="fileText" className="h-4 w-4" />
                            {form.processing ? 'Extracting...' : 'Extract Text'}
                        </button>
                    </div>
                </form>

                {latestUpload ? (
                    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    Latest Extraction
                                </h4>
                                <p className="mt-3 text-sm font-medium text-white">
                                    {latestUpload.file_type.toUpperCase()} upload
                                </p>
                                <p className="mt-1 text-xs text-slate-500">{latestUpload.created_at}</p>
                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                    {latestUpload.extracted_text || 'No readable text was detected in this upload.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onInsertText(latestUpload.extracted_text)}
                                disabled={!latestUpload.extracted_text}
                                className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Insert into note
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
