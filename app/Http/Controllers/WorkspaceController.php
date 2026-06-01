<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Models\WorkspaceInviteLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Workspaces/Index', [
            'workspaces' => $request->user()
                ->workspaces()
                ->withCount('notes')
                ->orderBy('name')
                ->get()
                ->map(fn (Workspace $workspace) => $this->transformWorkspace($request, $workspace))
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $workspace = DB::transaction(function () use ($request, $validated) {
            $workspace = $request->user()->ownedWorkspaces()->create($validated);
            $workspace->members()->attach($request->user()->id, ['role' => Workspace::ROLE_OWNER]);
            WorkspaceInviteLink::issue($workspace, Workspace::ROLE_EDITOR);
            WorkspaceInviteLink::issue($workspace, Workspace::ROLE_VIEWER);

            return $workspace;
        });

        return redirect()
            ->route('workspaces.notes.index', $workspace)
            ->with('success', 'Workspace created successfully.');
    }

    public function edit(Request $request, Workspace $workspace): Response
    {
        $this->ensureMember($request, $workspace);

        return Inertia::render('Workspaces/Settings', [
            'workspace' => $this->transformWorkspace($request, $workspace),
            'members' => $workspace->members()
                ->orderBy('name')
                ->get()
                ->map(fn ($member) => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'role' => $member->pivot->role,
                    'is_owner' => $member->id === $workspace->owner_id,
                ])
                ->values()
                ->all(),
            'inviteLinks' => $workspace->isOwner($request->user())
                ? $this->inviteLinksFor($workspace)
                : [],
        ]);
    }

    public function update(Request $request, Workspace $workspace): RedirectResponse
    {
        $this->ensureOwner($request, $workspace);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $workspace->update($validated);

        return back()->with('success', 'Workspace updated successfully.');
    }

    public function destroy(Request $request, Workspace $workspace): RedirectResponse
    {
        $this->ensureOwner($request, $workspace);
        DB::transaction(function () use ($workspace) {
            $workspace->notes()->withTrashed()->forceDelete();
            $workspace->delete();
        });

        return redirect()
            ->route('workspaces.index')
            ->with('success', 'Workspace deleted successfully.');
    }

    private function transformWorkspace(Request $request, Workspace $workspace): array
    {
        $role = $workspace->roleFor($request->user());

        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'description' => $workspace->description,
            'role' => $role,
            'can_edit' => $workspace->canEdit($request->user()),
            'is_owner' => $workspace->isOwner($request->user()),
            'notes_count' => $workspace->notes_count ?? null,
        ];
    }

    private function ensureMember(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->hasMember($request->user()), 403);
    }

    private function ensureOwner(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->isOwner($request->user()), 403);
    }

    private function inviteLinksFor(Workspace $workspace): array
    {
        return collect([Workspace::ROLE_VIEWER, Workspace::ROLE_EDITOR])
            ->map(function (string $role) use ($workspace) {
                $inviteLink = $workspace->inviteLinks()->where('role', $role)->first()
                    ?? WorkspaceInviteLink::issue($workspace, $role);

                return [
                    'role' => $role,
                    'url' => $inviteLink->url(),
                ];
            })
            ->all();
    }
}
