<?php

namespace App\Providers;

use App\Services\AutoCorrect\AutoCorrectService;
use App\Services\AutoCorrect\LanguageToolAutoCorrectService;
use App\Services\AutoCorrect\LocalAutoCorrectService;
use App\Services\Ocr\OcrService;
use App\Services\Ocr\TesseractOcrService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(OcrService::class, TesseractOcrService::class);
        $this->app->singleton(LocalAutoCorrectService::class);
        $this->app->bind(AutoCorrectService::class, function ($app) {
            return config('autocorrect.driver') === 'local'
                ? $app->make(LocalAutoCorrectService::class)
                : $app->make(LanguageToolAutoCorrectService::class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
