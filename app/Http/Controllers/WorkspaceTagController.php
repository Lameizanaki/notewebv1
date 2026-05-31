<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkspaceTagController extends Controller
{
    public function store(Request $request, Workspace $workspace): RedirectResponse
    {
        $this->ensureEditor($request, $workspace);
        $validated = $this->validateTag($request, $workspace);

        $workspace->tags()->create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Workspace tag created successfully.');
    }

    public function update(Request $request, Workspace $workspace, Tag $tag): RedirectResponse
    {
        $this->ensureEditor($request, $workspace);
        $tag = $workspace->tags()->findOrFail($tag->id);
        $tag->update($this->validateTag($request, $workspace, $tag));

        return back()->with('success', 'Workspace tag renamed successfully.');
    }

    public function destroy(Request $request, Workspace $workspace, Tag $tag): RedirectResponse
    {
        $this->ensureEditor($request, $workspace);
        $tag = $workspace->tags()->findOrFail($tag->id);
        $tag->notes()->detach();
        $tag->delete();

        return back()->with('success', 'Workspace tag deleted successfully.');
    }

    private function validateTag(Request $request, Workspace $workspace, ?Tag $tag = null): array
    {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('tags', 'name')
                    ->where(fn ($query) => $query->where('workspace_id', $workspace->id))
                    ->ignore($tag?->id),
            ],
        ]);
    }

    private function ensureEditor(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->canEdit($request->user()), 403);
    }
}
