<?php

return [
    'driver' => env('OCR_DRIVER', 'tesseract'),
    'tesseract_path' => env('OCR_TESSERACT_PATH', 'tesseract'),
    'ghostscript_path' => env('OCR_GHOSTSCRIPT_PATH', 'gswin64c'),
    'language' => env('OCR_LANGUAGE', 'eng'),
    'pdf_dpi' => (int) env('OCR_PDF_DPI', 300),
    'timeout' => (int) env('OCR_TIMEOUT', 120),
];
