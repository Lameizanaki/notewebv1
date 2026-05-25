<?php

namespace App\Services\AutoCorrect;

class LocalAutoCorrectService implements AutoCorrectService
{
    public function correct(string $text, ?string $language = null): AutoCorrectResult
    {
        unset($language);

        $normalized = preg_replace('/[ \t]{2,}/', ' ', $text) ?? $text;
        $normalized = preg_replace('/\bi\b/u', 'I', $normalized) ?? $normalized;

        $corrected = preg_replace_callback(
            '/([.!?])\s*([a-z])/u',
            static fn (array $matches): string => $matches[1].' '.mb_strtoupper($matches[2]),
            $normalized,
        ) ?? $normalized;

        return new AutoCorrectResult(
            text: $corrected,
            provider: 'local',
        );
    }
}
