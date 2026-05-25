<?php

namespace App\Services\Ocr;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

class TesseractOcrService implements OcrService
{
    public function extractText(string $path, ?string $mimeType, string $originalName): string
    {
        if (! is_file($path) || ! is_readable($path)) {
            throw new RuntimeException('The uploaded file could not be read for OCR.');
        }

        $mimeType = $mimeType ?: 'application/octet-stream';

        return match ($mimeType) {
            'application/pdf' => $this->extractFromPdf($path),
            'image/jpeg', 'image/jpg', 'image/png' => $this->extractFromImage($path),
            default => throw new RuntimeException('This file type is not supported for OCR.'),
        };
    }

    private function extractFromImage(string $path): string
    {
        return trim($this->runTesseract($path));
    }

    private function extractFromPdf(string $path): string
    {
        $ghostscript = $this->resolveBinary(
            (string) config('ocr.ghostscript_path', 'gswin64c'),
            'Ghostscript',
            'Install Ghostscript or set OCR_GHOSTSCRIPT_PATH to its executable.',
        );

        $tempDirectory = storage_path('app/tmp/ocr/'.Str::uuid());
        File::ensureDirectoryExists($tempDirectory);

        try {
            $outputPattern = $tempDirectory.DIRECTORY_SEPARATOR.'page-%03d.png';

            $this->runProcess([
                $ghostscript,
                '-dSAFER',
                '-dBATCH',
                '-dNOPAUSE',
                '-sDEVICE=png16m',
                '-r'.(string) config('ocr.pdf_dpi', 300),
                '-o',
                $outputPattern,
                $path,
            ], 'PDF conversion failed before OCR could start.');

            $images = collect(File::glob($tempDirectory.DIRECTORY_SEPARATOR.'page-*.png'))
                ->sort()
                ->values();

            if ($images->isEmpty()) {
                throw new RuntimeException('The PDF could not be converted into images for OCR.');
            }

            return $images
                ->map(fn (string $imagePath) => trim($this->runTesseract($imagePath)))
                ->filter()
                ->implode("\n\n");
        } finally {
            File::deleteDirectory($tempDirectory);
        }
    }

    private function runTesseract(string $path): string
    {
        $tesseract = $this->resolveBinary(
            (string) config('ocr.tesseract_path', 'tesseract'),
            'Tesseract OCR',
            'Install Tesseract and set OCR_TESSERACT_PATH if it is not on your PATH.',
        );

        return $this->runProcess([
            $tesseract,
            $path,
            'stdout',
            '-l',
            (string) config('ocr.language', 'eng'),
            '--psm',
            '3',
        ], 'OCR extraction failed while reading the image.');
    }

    private function runProcess(array $command, string $fallbackMessage): string
    {
        $process = new Process($command);
        $process->setTimeout((int) config('ocr.timeout', 120));

        try {
            $process->mustRun();
        } catch (ProcessFailedException $exception) {
            $error = trim($process->getErrorOutput()) ?: trim($process->getOutput());

            throw new RuntimeException($error !== '' ? $error : $fallbackMessage, previous: $exception);
        } catch (Throwable $exception) {
            throw new RuntimeException($fallbackMessage, previous: $exception);
        }

        return $process->getOutput();
    }

    private function resolveBinary(string $candidate, string $toolName, string $helpText): string
    {
        if ($candidate === '') {
            throw new RuntimeException("{$toolName} is not configured. {$helpText}");
        }

        if (str_contains($candidate, '\\') || str_contains($candidate, '/')) {
            if (is_file($candidate)) {
                return $candidate;
            }

            throw new RuntimeException("{$toolName} was not found at {$candidate}. {$helpText}");
        }

        $resolved = (new ExecutableFinder())->find($candidate);

        if ($resolved !== null) {
            return $resolved;
        }

        throw new RuntimeException("{$toolName} is not installed. {$helpText}");
    }
}
