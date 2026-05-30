<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AutoCorrectTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_check_text_with_languagetool(): void
    {
        Http::fake([
            'api.languagetool.org/*' => Http::response([
                'matches' => [
                    [
                        'offset' => 8,
                        'length' => 4,
                        'message' => 'Possible spelling mistake found.',
                        'shortMessage' => 'Spelling mistake',
                        'replacements' => [
                            ['value' => 'test'],
                        ],
                        'rule' => [
                            'id' => 'MORFOLOGIK_RULE_EN_US',
                            'issueType' => 'misspelling',
                            'category' => [
                                'id' => 'TYPOS',
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this
            ->actingAs(User::factory()->create())
            ->postJson(route('auto-correct.check'), [
                'text' => 'This is a tset.',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('matches.0.offset', 8)
            ->assertJsonPath('matches.0.replacements.0', 'test');
    }

    public function test_auto_correct_requires_authentication(): void
    {
        $this
            ->postJson(route('auto-correct.check'), [
                'text' => 'This is a tset.',
            ])
            ->assertUnauthorized();
    }
}
