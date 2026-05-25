<?php

namespace App\Http\Controllers;

use App\Http\Requests\AutoCorrectRequest;
use App\Services\AutoCorrect\AutoCorrectService;
use Illuminate\Http\JsonResponse;
use Throwable;

class AutoCorrectController extends Controller
{
    public function store(AutoCorrectRequest $request, AutoCorrectService $autoCorrectService): JsonResponse
    {
        $validated = $request->validated();

        try {
            $result = $autoCorrectService->correct(
                $validated['text'],
                $validated['language'] ?? null,
            );
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => $exception->getMessage() ?: 'Auto Correct failed. Please try again.',
            ], 422);
        }

        return response()->json([
            'text' => $result->text,
            'changed' => $result->text !== $validated['text'],
            'provider' => $result->provider,
            'fallback_used' => $result->fallbackUsed,
        ]);
    }
}
