<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrashTest extends TestCase
{
    use RefreshDatabase;

    public function test_trash_can_be_searched_by_title(): void
    {
        $user = User::factory()->create();
        $matchingNote = $user->notes()->create(['title' => 'Lecture notes']);
        $otherNote = $user->notes()->create(['title' => 'Shopping list']);
        $matchingNote->delete();
        $otherNote->delete();

        $response = $this
            ->actingAs($user)
            ->get('/trash?search=Lecture');

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Trash')
            ->where('filters.search', 'Lecture')
            ->has('notes', 1)
            ->where('notes.0.title', 'Lecture notes')
        );
    }

    public function test_trash_can_be_sorted_by_oldest_deleted_note(): void
    {
        $user = User::factory()->create();
        $newerNote = $user->notes()->create(['title' => 'Newer']);
        $olderNote = $user->notes()->create(['title' => 'Older']);

        $newerNote->delete();
        $olderNote->delete();
        $olderNote->forceFill(['deleted_at' => now()->subDay()])->save();

        $response = $this
            ->actingAs($user)
            ->get('/trash?sort=oldest');

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Trash')
            ->where('filters.sort', 'oldest')
            ->where('notes.0.title', 'Older')
            ->where('notes.1.title', 'Newer')
        );
    }
}
