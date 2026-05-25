<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AutoCorrectTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_correct_uses_languagetool_suggestions(): void
    {
        config()->set('autocorrect.driver', 'languagetool');
        config()->set('services.languagetool.base_url', 'https://api.languagetool.org/v2');

        Http::fake([
            'https://api.languagetool.org/v2/check' => Http::response([
                'matches' => [
                    [
                        'offset' => 0,
                        'length' => 1,
                        'replacements' => [
                            ['value' => 'I'],
                        ],
                    ],
                    [
                        'offset' => 2,
                        'length' => 4,
                        'replacements' => [
                            ['value' => 'went'],
                        ],
                    ],
                ],
            ]),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('autocorrect.store'), [
                'text' => 'i goed home',
            ])
            ->assertOk()
            ->assertJson([
                'text' => 'I went home',
                'changed' => true,
                'provider' => 'languagetool',
                'fallback_used' => false,
            ]);
    }

    public function test_auto_correct_falls_back_to_local_cleanup_when_languagetool_fails(): void
    {
        config()->set('autocorrect.driver', 'languagetool');
        config()->set('autocorrect.fallback_to_local', true);
        config()->set('services.languagetool.base_url', 'https://api.languagetool.org/v2');

        Http::fake([
            'https://api.languagetool.org/v2/check' => Http::response([], 500),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('autocorrect.store'), [
                'text' => 'i am here.hello',
            ])
            ->assertOk()
            ->assertJson([
                'text' => 'I am here. Hello',
                'changed' => true,
                'provider' => 'languagetool',
                'fallback_used' => true,
            ]);
    }

    public function test_auto_correct_requires_authentication(): void
    {
        $this->postJson(route('autocorrect.store'), [
            'text' => 'hello',
        ])->assertUnauthorized();
    }
}
