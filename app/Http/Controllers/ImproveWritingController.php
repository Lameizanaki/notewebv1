<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ImproveWritingController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:20000'],
        ]);

        $apiKey = config('services.gemini.key');

        if (! $apiKey) {
            return response()->json([
                'message' => 'Gemini API key is not configured.',
            ], 503);
        }

        $baseUrl = rtrim((string) config('services.gemini.base_url'), '/');
        $model = config('services.gemini.model');

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
            ])
                ->timeout((int) config('services.gemini.timeout', 20))
                ->retry(1, 500)
                ->post("{$baseUrl}/models/{$model}:generateContent", [
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [
                                [
                                    'text' => $this->prompt($validated['text']),
                                ],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'topP' => 0.9,
                        'maxOutputTokens' => 4096,
                    ],
                ]);
        } catch (ConnectionException) {
            return response()->json([
                'message' => 'Improve Writing is unavailable right now.',
            ], 502);
        }

        if ($response->failed()) {
            return response()->json([
                'message' => 'Improve Writing is unavailable right now.',
            ], 502);
        }

        $improvedText = trim((string) data_get($response->json(), 'candidates.0.content.parts.0.text', ''));

        if ($improvedText === '') {
            return response()->json([
                'message' => 'Gemini did not return improved text.',
            ], 502);
        }

        return response()->json([
            'improved_text' => $improvedText,
        ]);
    }

    private function prompt(string $text): string
    {
        return <<<PROMPT
Rewrite the note below in clear, natural English.

Rules:
- Preserve the original meaning and details.
- Correct spelling, grammar, tense, punctuation, capitalization, and sentence flow.
- Break long run-on sentences into readable sentences.
- Do not add new facts.
- Do not summarize.
- Do not use markdown.
- Return only the improved note text.

Note:
{$text}
PROMPT;
    }
}
