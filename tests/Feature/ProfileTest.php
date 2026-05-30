<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/settings');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();
        $originalEmail = $user->email;

        $response = $this
            ->actingAs($user)
            ->patch('/settings', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame($originalEmail, $user->email);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_email_cannot_be_updated_from_settings(): void
    {
        $user = User::factory()->create();
        $originalEmail = $user->email;

        $response = $this
            ->actingAs($user)
            ->patch('/settings', [
                'name' => 'Test User',
                'email' => 'changed@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings');

        $user->refresh();

        $this->assertSame($originalEmail, $user->email);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/settings', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->delete('/settings', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/settings');

        $this->assertNotNull($user->fresh());
    }

    public function test_google_only_user_can_delete_account_with_delete_confirmation(): void
    {
        $user = User::factory()->create([
            'google_id' => 'google-123',
            'password_set_at' => null,
        ]);

        $response = $this
            ->actingAs($user)
            ->delete('/settings', [
                'delete_confirmation' => 'DELETE',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_google_only_user_must_confirm_delete_account(): void
    {
        $user = User::factory()->create([
            'google_id' => 'google-123',
            'password_set_at' => null,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->delete('/settings', [
                'delete_confirmation' => 'delete',
            ]);

        $response
            ->assertSessionHasErrors('delete_confirmation')
            ->assertRedirect('/settings');

        $this->assertNotNull($user->fresh());
    }
}
