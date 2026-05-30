<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\UniqueUsername;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Google login failed. Please try again.']);
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Google did not return an email address.']);
        }

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $googleUser->getId(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        } else {
            $name = $googleUser->getName() ?: Str::before($email, '@');

            $user = User::create([
                'name' => $name,
                'username' => UniqueUsername::make($name ?: $email),
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'email_verified_at' => now(),
                'password' => Hash::make(Str::password(32)),
                'password_set_at' => null,
            ]);
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
