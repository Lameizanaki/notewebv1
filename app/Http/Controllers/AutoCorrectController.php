<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AutoCorrectController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:20000'],
        ]);

        $baseUrl = rtrim((string) config('services.languagetool.base_url'), '/');

        try {
            $response = Http::asForm()
                ->timeout((int) config('services.languagetool.timeout', 10))
                ->retry(1, 300)
                ->post("{$baseUrl}/check", [
                    'text' => $validated['text'],
                    'language' => 'en-US',
                    'enabledOnly' => 'false',
                ]);
        } catch (ConnectionException) {
            return response()->json([
                'message' => 'Auto correct service is unavailable right now.',
            ], 502);
        }

        if ($response->failed()) {
            return response()->json([
                'message' => 'Auto correct service is unavailable right now.',
            ], 502);
        }

        $matches = collect($response->json('matches', []))
            ->map(fn (array $match) => [
                'offset' => $match['offset'] ?? 0,
                'length' => $match['length'] ?? 0,
                'message' => $match['message'] ?? '',
                'shortMessage' => $match['shortMessage'] ?? '',
                'rule' => [
                    'id' => $match['rule']['id'] ?? '',
                    'category' => $match['rule']['category']['id'] ?? '',
                    'issueType' => $match['rule']['issueType'] ?? '',
                ],
                'replacements' => collect($match['replacements'] ?? [])
                    ->take(5)
                    ->map(fn (array $replacement) => $replacement['value'] ?? '')
                    ->filter()
                    ->values(),
            ])
            ->values();

        return response()->json([
            'matches' => $matches,
        ]);
    }
}
