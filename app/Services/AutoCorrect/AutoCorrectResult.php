<?php

namespace App\Services\AutoCorrect;

class AutoCorrectResult
{
    public function __construct(
        public readonly string $text,
        public readonly string $provider,
        public readonly bool $fallbackUsed = false,
    ) {
    }
}
