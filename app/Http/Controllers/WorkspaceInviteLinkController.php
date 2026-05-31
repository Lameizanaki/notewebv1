<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Models\WorkspaceInviteLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkspaceInviteLinkController extends Controller
{
    public function regenerate(Request $request, Workspace $workspace, string $role): RedirectResponse
    {
        abort_unless($workspace->isOwner($request->user()), 403);

        validator(
            ['role' => $role],
            ['role' => ['required', Rule::in([Workspace::ROLE_EDITOR, Workspace::ROLE_VIEWER])]],
        )->validate();

        WorkspaceInviteLink::issue($workspace, $role);

        return back()->with('success', ucfirst($role).' invitation link regenerated successfully.');
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $inviteLink = WorkspaceInviteLink::query()
            ->where('token_hash', hash('sha256', $token))
            ->firstOrFail();
        $workspace = $inviteLink->workspace;

        if (! $workspace->hasMember($request->user())) {
            $workspace->members()->attach($request->user()->id, [
                'role' => $inviteLink->role,
            ]);
        }

        return redirect()
            ->route('workspaces.notes.index', $workspace)
            ->with('success', 'Workspace invitation accepted successfully.');
    }
}
