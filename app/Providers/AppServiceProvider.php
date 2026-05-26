<?php

namespace App\Providers;

use App\Services\AutoCorrect\AutoCorrectService;
use App\Services\AutoCorrect\LanguageToolAutoCorrectService;
use App\Services\AutoCorrect\LocalAutoCorrectService;
use App\Services\Ocr\OcrService;
use App\Services\Ocr\TesseractOcrService;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
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
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
            URL::forceRootUrl(config('app.url'));
        }

        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            $path = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ],
                absolute: false,
            );

            return rtrim(config('app.url'), '/').$path;
        });

        Vite::prefetch(concurrency: 3);
    }
}
