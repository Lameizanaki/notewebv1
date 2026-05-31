<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkspaceMemberController extends Controller
{
    public function store(Request $request, Workspace $workspace): RedirectResponse
    {
        $this->ensureOwner($request, $workspace);

        $validated = $request->validate([
            'email' => ['required', 'email', Rule::exists('users', 'email')],
            'role' => ['required', Rule::in([Workspace::ROLE_EDITOR, Workspace::ROLE_VIEWER])],
        ]);

        $member = User::where('email', $validated['email'])->firstOrFail();

        if ($member->id === $workspace->owner_id) {
            return back()->withErrors(['email' => 'The workspace owner is already a member.']);
        }

        $workspace->members()->syncWithoutDetaching([
            $member->id => ['role' => $validated['role']],
        ]);

        return back()->with('success', 'Workspace member added successfully.');
    }

    public function update(Request $request, Workspace $workspace, User $user): RedirectResponse
    {
        $this->ensureOwner($request, $workspace);
        abort_if($user->id === $workspace->owner_id, 422);

        $validated = $request->validate([
            'role' => ['required', Rule::in([Workspace::ROLE_EDITOR, Workspace::ROLE_VIEWER])],
        ]);

        abort_unless($workspace->members()->whereKey($user->id)->exists(), 404);

        $workspace->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);

        return back()->with('success', 'Workspace role updated successfully.');
    }

    public function destroy(Request $request, Workspace $workspace, User $user): RedirectResponse
    {
        $this->ensureOwner($request, $workspace);
        abort_if($user->id === $workspace->owner_id, 422);

        $workspace->members()->detach($user->id);

        return back()->with('success', 'Workspace member removed successfully.');
    }

    private function ensureOwner(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->isOwner($request->user()), 403);
    }
}
