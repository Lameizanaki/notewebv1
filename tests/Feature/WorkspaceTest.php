<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInviteLink;
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
        $this->assertDatabaseHas('workspace_invite_links', [
            'workspace_id' => $workspace->id,
            'role' => Workspace::ROLE_VIEWER,
        ]);
        $this->assertDatabaseHas('workspace_invite_links', [
            'workspace_id' => $workspace->id,
            'role' => Workspace::ROLE_EDITOR,
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

    public function test_owner_can_add_google_user_with_normalized_email(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $googleUser = User::factory()->create([
            'email' => 'google.user@example.com',
            'google_id' => 'google-user-id',
            'password_set_at' => null,
        ]);

        $this
            ->actingAs($owner)
            ->post(route('workspaces.members.store', $workspace), [
                'email' => '  GOOGLE.USER@EXAMPLE.COM ',
                'role' => Workspace::ROLE_VIEWER,
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $googleUser->id,
            'role' => Workspace::ROLE_VIEWER,
        ]);
    }

    public function test_user_can_join_workspace_with_viewer_link(): void
    {
        [, $workspace] = $this->workspaceOwnedBy();
        $viewer = User::factory()->create();
        $inviteLink = WorkspaceInviteLink::issue($workspace, Workspace::ROLE_VIEWER);

        $this
            ->actingAs($viewer)
            ->get(route('workspace-invites.accept', $inviteLink->token))
            ->assertRedirect(route('workspaces.notes.index', $workspace));

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $viewer->id,
            'role' => Workspace::ROLE_VIEWER,
        ]);
    }

    public function test_viewer_link_does_not_downgrade_existing_editor(): void
    {
        [, $workspace] = $this->workspaceOwnedBy();
        $editor = User::factory()->create();
        $workspace->members()->attach($editor->id, ['role' => Workspace::ROLE_EDITOR]);
        $inviteLink = WorkspaceInviteLink::issue($workspace, Workspace::ROLE_VIEWER);

        $this
            ->actingAs($editor)
            ->get(route('workspace-invites.accept', $inviteLink->token))
            ->assertRedirect(route('workspaces.notes.index', $workspace));

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $editor->id,
            'role' => Workspace::ROLE_EDITOR,
        ]);
    }

    public function test_editor_link_promotes_existing_viewer(): void
    {
        [, $workspace] = $this->workspaceOwnedBy();
        $viewer = User::factory()->create();
        $workspace->members()->attach($viewer->id, ['role' => Workspace::ROLE_VIEWER]);
        $inviteLink = WorkspaceInviteLink::issue($workspace, Workspace::ROLE_EDITOR);

        $this
            ->actingAs($viewer)
            ->get(route('workspace-invites.accept', $inviteLink->token))
            ->assertRedirect(route('workspaces.notes.index', $workspace));

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $viewer->id,
            'role' => Workspace::ROLE_EDITOR,
        ]);
    }

    public function test_regenerating_invite_link_invalidates_old_link(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $inviteLink = WorkspaceInviteLink::issue($workspace, Workspace::ROLE_EDITOR);
        $oldToken = $inviteLink->token;

        $this
            ->actingAs($owner)
            ->post(route('workspaces.invite-links.regenerate', [$workspace, Workspace::ROLE_EDITOR]))
            ->assertSessionHasNoErrors();

        $this
            ->actingAs(User::factory()->create())
            ->get(route('workspace-invites.accept', $oldToken))
            ->assertNotFound();
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

    public function test_workspace_member_can_poll_latest_note_snapshot(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $viewer = User::factory()->create();
        $workspace->members()->attach($viewer->id, ['role' => Workspace::ROLE_VIEWER]);
        $note = $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Live lecture notes',
            'content' => '<p>First version</p>',
        ]);

        $this
            ->actingAs($viewer)
            ->getJson(route('workspaces.notes.snapshot', [$workspace, $note]))
            ->assertOk()
            ->assertJsonPath('note.title', 'Live lecture notes')
            ->assertJsonPath('note.content', '<p>First version</p>')
            ->assertJsonPath('note.sync_version', 0);
    }

    public function test_non_member_cannot_poll_workspace_note_snapshot(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $note = $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Private workspace note',
        ]);

        $this
            ->actingAs(User::factory()->create())
            ->getJson(route('workspaces.notes.snapshot', [$workspace, $note]))
            ->assertForbidden();
    }

    public function test_updating_shared_note_increments_sync_version(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $note = $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Draft',
            'content' => '<p>Before</p>',
        ]);

        $this
            ->actingAs($owner)
            ->patchJson(route('workspaces.notes.update', [$workspace, $note]), [
                'title' => 'Updated draft',
                'content' => '<p>After</p>',
                'is_pinned' => false,
                'tag_ids' => [],
            ])
            ->assertOk()
            ->assertJsonPath('note.sync_version', 1);

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'sync_version' => 1,
        ]);
    }

    public function test_pinning_shared_note_increments_sync_version(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $note = $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Pin this note',
        ]);

        $this
            ->actingAs($owner)
            ->patch(route('workspaces.notes.pin', [$workspace, $note]), [
                'is_pinned' => true,
            ]);

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'is_pinned' => true,
            'sync_version' => 1,
        ]);
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

    public function test_pinned_shared_notes_are_listed_before_unpinned_notes(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Recently updated normal note',
            'is_pinned' => false,
            'updated_at' => now(),
        ]);
        $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Older pinned note',
            'is_pinned' => true,
            'updated_at' => now()->subDay(),
        ]);

        $this
            ->actingAs($owner)
            ->get(route('workspaces.notes.index', $workspace))
            ->assertInertia(fn (Assert $page) => $page
                ->where('notes.0.title', 'Older pinned note')
                ->where('notes.1.title', 'Recently updated normal note')
            );
    }

    public function test_workspace_search_is_case_insensitive(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Weekly PROJECT Report',
        ]);

        $this
            ->actingAs($owner)
            ->get(route('workspaces.notes.index', [$workspace, 'search' => 'project']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('notes', 1)
                ->where('notes.0.title', 'Weekly PROJECT Report')
            );
    }

    public function test_deleting_workspace_permanently_removes_all_shared_notes(): void
    {
        [$owner, $workspace] = $this->workspaceOwnedBy();
        $activeNote = $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Active shared note',
        ]);
        $trashedNote = $workspace->notes()->create([
            'user_id' => $owner->id,
            'title' => 'Trashed shared note',
        ]);
        $trashedNote->delete();

        $this
            ->actingAs($owner)
            ->delete(route('workspaces.destroy', $workspace))
            ->assertRedirect(route('workspaces.index'));

        $this->assertDatabaseMissing('workspaces', ['id' => $workspace->id]);
        $this->assertDatabaseMissing('notes', ['id' => $activeNote->id]);
        $this->assertDatabaseMissing('notes', ['id' => $trashedNote->id]);
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
