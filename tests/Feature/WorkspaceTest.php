<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_workspace_as_owner(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post('/workspaces', [
                'name' => 'WCT Group',
                'description' => 'Shared coursework notes',
            ]);

        $workspace = Workspace::query()->sole();

        $response->assertRedirect(route('workspaces.notes.index', $workspace));
        $this->assertSame($user->id, $workspace->owner_id);
        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => Workspace::ROLE_OWNER,
        ]);
    }

    public function test_owner_can_add_existing_user_as_editor(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $editor = User::factory()->create();

        $response = $this
            ->actingAs($owner)
            ->post(route('workspaces.members.store', $workspace), [
                'email' => $editor->email,
                'role' => Workspace::ROLE_EDITOR,
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $editor->id,
            'role' => Workspace::ROLE_EDITOR,
        ]);
    }

    public function test_editor_can_create_shared_note(): void
    {
        [, $workspace] = $this->workspaceOwnedBy();
        $editor = User::factory()->create();
        $workspace->members()->attach($editor->id, ['role' => Workspace::ROLE_EDITOR]);

        $response = $this
            ->actingAs($editor)
            ->post(route('workspaces.notes.store', $workspace), [
                'title' => 'Shared report',
                'content' => '<p>Draft content</p>',
                'tag_ids' => [],
            ]);

        $note = $workspace->notes()->sole();

        $response->assertRedirect(route('workspaces.notes.show', [$workspace, $note]));
        $this->assertSame($editor->id, $note->user_id);
    }

    public function test_viewer_can_view_but_cannot_create_shared_note(): void
    {
        [, $workspace] = $this->workspaceOwnedBy();
        $viewer = User::factory()->create();
        $workspace->members()->attach($viewer->id, ['role' => Workspace::ROLE_VIEWER]);
        $note = $workspace->notes()->create([
            'user_id' => $workspace->owner_id,
            'title' => 'Read only note',
        ]);

        $this
            ->actingAs($viewer)
            ->get(route('workspaces.notes.show', [$workspace, $note]))
            ->assertOk();

        $this
            ->actingAs($viewer)
            ->post(route('workspaces.notes.store', $workspace), [
                'title' => 'Blocked note',
            ])
            ->assertForbidden();
    }

    public function test_non_member_cannot_access_workspace_notes(): void
    {
        [, $workspace] = $this->workspaceOwnedBy();

        $this
            ->actingAs(User::factory()->create())
            ->get(route('workspaces.notes.index', $workspace))
            ->assertForbidden();
    }

    public function test_shared_note_is_not_listed_as_personal_note(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Shared only',
        ]);

        $this
            ->actingAs($owner)
            ->get(route('notes.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Notes/Index')
                ->has('notes', 0)
            );
    }

    public function test_workspace_can_reuse_a_personal_tag_name(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $owner->tags()->create(['name' => 'todo']);

        $this
            ->actingAs($owner)
            ->post(route('workspaces.tags.store', $workspace), [
                'name' => 'todo',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('tags', [
            'workspace_id' => $workspace->id,
            'name' => 'todo',
        ]);
    }

    private function workspaceOwnedBy(): array
    {
        $owner = User::factory()->create();
        $workspace = Workspace::create([
            'owner_id' => $owner->id,
            'name' => 'Team Notes',
        ]);
        $workspace->members()->attach($owner->id, ['role' => Workspace::ROLE_OWNER]);

        return [$owner, $workspace];
    }
}
