<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->put('/password', [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings');

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
        $this->assertNotNull($user->password_set_at);
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->put('/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response
            ->assertSessionHasErrors('current_password')
            ->assertRedirect('/settings');
    }

    public function test_password_can_be_set_without_current_password_for_google_only_account(): void
    {
        $user = User::factory()->create([
            'google_id' => 'google-123',
            'password_set_at' => null,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->put('/password', [
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings');

        $user->refresh();

        $this->assertTrue(Hash::check('new-password', $user->password));
        $this->assertNotNull($user->password_set_at);
    }

    public function test_password_login_repairs_missing_password_set_timestamp(): void
    {
        $user = User::factory()->create([
            'password_set_at' => null,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));

        $this->assertNotNull($user->refresh()->password_set_at);
    }
}
