<?php

namespace App\Services\Ocr;

use Illuminate\Support\Str;

class MockOcrService implements OcrService
{
    public function extractText(string $path, ?string $mimeType, string $originalName): string
    {
        $name = trim($originalName) !== '' ? $originalName : 'uploaded file';
        $type = $mimeType ?: 'unknown file type';

        return implode("\n", [
            'OCR placeholder result',
            '',
            "File: {$name}",
            "Type: {$type}",
            '',
            'This demo upload was accepted successfully. Real OCR extraction will be connected later.',
            'You can insert this placeholder text into the note for now.',
            '',
            'Reference: '.Str::limit(pathinfo($name, PATHINFO_FILENAME), 80, ''),
        ]);
    }
}
