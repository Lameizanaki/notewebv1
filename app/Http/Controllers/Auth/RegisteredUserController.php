<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255|alpha_dash|unique:'.User::class.',username',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->filled('username')
                ? Str::lower($request->string('username')->toString())
                : $this->makeUniqueUsername($request->name ?: Str::before($request->email, '@')),
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);

        try {
            event(new Registered($user));
        } catch (Throwable $exception) {
            report($exception);
            Log::error('Verification email failed during registration.', [
                'email' => $user->email,
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'scheme' => config('mail.mailers.smtp.scheme'),
                'exception' => $exception->getMessage(),
            ]);

            return redirect(route('dashboard', absolute: false))->with('status', 'verification-email-failed');
        }

        return redirect(route('dashboard', absolute: false));
    }

    private function makeUniqueUsername(string $seed): string
    {
        $base = Str::lower(Str::slug($seed, '_'));

        if ($base === '') {
            $base = 'user';
        }

        $username = $base;
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
            $username = "{$base}_{$suffix}";
            $suffix++;
        }

        return $username;
    }
}
