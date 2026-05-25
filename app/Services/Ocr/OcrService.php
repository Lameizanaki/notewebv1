<?php

namespace App\Services\Ocr;

interface OcrService
{
    public function extractText(string $path, ?string $mimeType, string $originalName): string;
}
