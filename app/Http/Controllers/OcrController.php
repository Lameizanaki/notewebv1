<?php

namespace App\Http\Controllers;

use App\Http\Requests\OcrUploadRequest;
use App\Services\Ocr\OcrService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Throwable;

class OcrController extends Controller
{
    public function store(OcrUploadRequest $request, OcrService $ocrService): RedirectResponse
    {
        $validated = $request->validated();
        $file = $request->file('file');
        $path = $file->store('ocr-uploads', 'public');

        try {
            $extractedText = $ocrService->extractText(
                $file->getRealPath(),
                $file->getMimeType() ?: $file->getClientMimeType(),
                $file->getClientOriginalName(),
            );

            $this->deletePreviousUploads($request);

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
                ->withErrors([
                    'file' => $exception->getMessage() ?: 'OCR extraction failed. Please try again.',
                ])
                ->withInput();
        }

        return back()->with('success', 'OCR text extracted successfully.');
    }

    private function deletePreviousUploads(OcrUploadRequest $request): void
    {
        $uploads = $request->user()->ocrUploads()->get();

        foreach ($uploads as $upload) {
            if ($upload->file_path) {
                Storage::disk('public')->delete($upload->file_path);
            }

            $upload->delete();
        }
    }
}
