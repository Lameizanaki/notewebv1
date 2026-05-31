<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Services\Ocr\OcrService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Throwable;

class WorkspaceOcrController extends Controller
{
    public function store(Request $request, Workspace $workspace, OcrService $ocrService): RedirectResponse
    {
        abort_unless($workspace->canEdit($request->user()), 403);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:png,jpg,jpeg,pdf', 'max:10240'],
            'note_id' => [
                'nullable',
                'integer',
                Rule::exists('notes', 'id')->where(
                    fn ($query) => $query
                        ->where('workspace_id', $workspace->id)
                        ->whereNull('deleted_at')
                ),
            ],
        ]);

        $file = $request->file('file');
        $path = $file->store('ocr-uploads', 'public');

        try {
            $extractedText = $ocrService->extractText(
                $file->getRealPath(),
                $file->getMimeType() ?: $file->getClientMimeType(),
                $file->getClientOriginalName(),
            );

            foreach ($request->user()->ocrUploads()->get() as $upload) {
                Storage::disk('public')->delete($upload->file_path);
                $upload->delete();
            }

            $request->user()->ocrUploads()->create([
                'note_id' => $validated['note_id'] ?? null,
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension(),
                'extracted_text' => $extractedText !== '' ? $extractedText : null,
            ]);
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($path);
            report($exception);

            return back()
                ->withErrors(['file' => $exception->getMessage() ?: 'OCR extraction failed. Please try again.'])
                ->withInput();
        }

        return back()->with('success', 'OCR text extracted successfully.');
    }
}
