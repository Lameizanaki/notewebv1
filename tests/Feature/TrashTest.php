<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
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
            ->get('/trash?search=lecture');

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Trash')
            ->where('filters.search', 'lecture')
            ->has('notes', 1)
            ->where('notes.0.title', 'Lecture notes')
        );
    }

    public function test_trash_includes_deleted_shared_notes_grouped_by_workspace(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $workspace = Workspace::create([
            'owner_id' => $owner->id,
            'name' => 'WCT Team',
        ]);
        $workspace->members()->attach($owner->id, ['role' => Workspace::ROLE_OWNER]);
        $workspace->members()->attach($viewer->id, ['role' => Workspace::ROLE_VIEWER]);
        $note = $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Shared Lecture Notes',
        ]);
        $note->delete();

        $this
            ->actingAs($viewer)
            ->get('/trash?search=lecture')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Trash')
                ->has('workspaces', 1)
                ->where('workspaces.0.name', 'WCT Team')
                ->where('workspaces.0.can_edit', false)
                ->has('workspaces.0.notes', 1)
                ->where('workspaces.0.notes.0.title', 'Shared Lecture Notes')
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
