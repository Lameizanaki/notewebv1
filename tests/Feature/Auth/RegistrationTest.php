<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'username' => 'test_user',
        ]);
        $this->assertNotNull(auth()->user()->password_set_at);
    }

    public function test_existing_google_account_receives_clear_registration_message(): void
    {
        User::factory()->create([
            'email' => 'google@example.com',
            'google_id' => 'google-123',
            'password_set_at' => null,
        ]);

        $response = $this
            ->from('/register')
            ->post('/register', [
                'name' => 'Google User',
                'email' => 'google@example.com',
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

        $response
            ->assertRedirect('/register')
            ->assertSessionHasErrors([
                'email' => 'An account already exists with this email. Sign in with Google or use Forgot Password to set a password.',
            ]);
    }
}
