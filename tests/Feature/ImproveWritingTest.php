<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ImproveWritingTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_improve_writing_with_gemini(): void
    {
        Config::set('services.gemini.key', 'fake-gemini-key');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => 'Yesterday, I went to the library because I needed to finish my assignment.',
                                ],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this
            ->actingAs(User::factory()->create())
            ->postJson(route('improve-writing.store'), [
                'text' => 'yesterday i goes to the libary because i need to finish my assigment',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'improved_text',
                'Yesterday, I went to the library because I needed to finish my assignment.',
            );
    }

    public function test_improve_writing_requires_gemini_key(): void
    {
        Config::set('services.gemini.key', null);

        $this
            ->actingAs(User::factory()->create())
            ->postJson(route('improve-writing.store'), [
                'text' => 'this need better english',
            ])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Gemini API key is not configured.');
    }

    public function test_improve_writing_requires_authentication(): void
    {
        $this
            ->postJson(route('improve-writing.store'), [
                'text' => 'this need better english',
            ])
            ->assertUnauthorized();
    }
}
