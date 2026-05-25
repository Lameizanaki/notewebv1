<?php

namespace App\Services\AutoCorrect;

use Illuminate\Http\Client\Factory as HttpFactory;
use RuntimeException;

class LanguageToolAutoCorrectService implements AutoCorrectService
{
    public function __construct(
        private readonly HttpFactory $http,
        private readonly LocalAutoCorrectService $fallback,
    ) {
    }

    public function correct(string $text, ?string $language = null): AutoCorrectResult
    {
        if (trim($text) === '') {
            return new AutoCorrectResult(
                text: $text,
                provider: 'languagetool',
            );
        }

        try {
            $response = $this->http
                ->asForm()
                ->timeout((int) config('services.languagetool.timeout', 10))
                ->post($this->endpoint(), [
                    'text' => $text,
                    'language' => $language ?: config('autocorrect.language', 'en-US'),
                ])
                ->throw();
        } catch (\Throwable $exception) {
            if (config('autocorrect.fallback_to_local', true)) {
                $fallbackResult = $this->fallback->correct($text, $language);

                return new AutoCorrectResult(
                    text: $fallbackResult->text,
                    provider: 'languagetool',
                    fallbackUsed: true,
                );
            }

            throw new RuntimeException('Auto Correct is unavailable right now. Please try again.', previous: $exception);
        }

        return new AutoCorrectResult(
            text: $this->applyMatches($text, $response->json('matches', [])),
            provider: 'languagetool',
        );
    }

    private function endpoint(): string
    {
        $baseUrl = rtrim((string) config('services.languagetool.base_url'), '/');

        if ($baseUrl === '') {
            throw new RuntimeException('LanguageTool is not configured.');
        }

        return $baseUrl.'/check';
    }

    /**
     * @param  array<int, array<string, mixed>>  $matches
     */
    private function applyMatches(string $text, array $matches): string
    {
        usort(
            $matches,
            static fn (array $left, array $right): int => ($right['offset'] ?? 0) <=> ($left['offset'] ?? 0),
        );

        foreach ($matches as $match) {
            $replacement = $match['replacements'][0]['value'] ?? null;
            $offset = $match['offset'] ?? null;
            $length = $match['length'] ?? null;

            if (!is_string($replacement) || !is_int($offset) || !is_int($length) || $length < 0) {
                continue;
            }

            $text = mb_substr($text, 0, $offset)
                .$replacement
                .mb_substr($text, $offset + $length);
        }

        return $text;
    }
}
