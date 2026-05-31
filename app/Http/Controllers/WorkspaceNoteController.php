<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkspaceNoteRequest;
use App\Http\Requests\UpdateWorkspaceNoteRequest;
use App\Models\Note;
use App\Models\Workspace;
use App\Support\WorkspaceNotePresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceNoteController extends Controller
{
    public function index(Request $request, Workspace $workspace): Response
    {
        $this->ensureMember($request, $workspace);
        [$search, $tagId, $sort] = $this->resolveFilters($request, $workspace);

        $notes = $this->applyListFilters($workspace->notes()->with('tags'), $search, $tagId, $sort)->get();

        return Inertia::render('Workspaces/Notes/Index', [
            'workspace' => $this->workspaceData($request, $workspace),
            'filters' => compact('search', 'sort') + ['tag' => $tagId],
            'notes' => WorkspaceNotePresenter::notes($notes),
            'tags' => WorkspaceNotePresenter::tags($workspace->tags()->orderBy('name')->get()),
        ]);
    }

    public function create(Request $request, Workspace $workspace): Response
    {
        $this->ensureEditor($request, $workspace);

        return Inertia::render('Workspaces/Notes/Create', [
            'workspace' => $this->workspaceData($request, $workspace),
            'tags' => WorkspaceNotePresenter::tags($workspace->tags()->orderBy('name')->get()),
            'ocrUploads' => WorkspaceNotePresenter::uploads($request->user()->ocrUploads()->latest()->limit(1)->get()),
        ]);
    }

    public function store(StoreWorkspaceNoteRequest $request, Workspace $workspace): RedirectResponse
    {
        $validated = $request->validated();

        $note = $workspace->notes()->create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'content' => $validated['content'] ?? null,
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
        ]);

        $note->tags()->sync($validated['tag_ids'] ?? []);

        return redirect()
            ->route('workspaces.notes.show', [$workspace, $note])
            ->with('success', 'Shared note created successfully.');
    }

    public function show(Request $request, Workspace $workspace, Note $note): Response
    {
        $this->ensureMember($request, $workspace);
        $note = $this->workspaceNote($workspace, $note);

        return Inertia::render('Workspaces/Notes/Show', [
            'workspace' => $this->workspaceData($request, $workspace),
            'note' => WorkspaceNotePresenter::note($note),
            'tags' => WorkspaceNotePresenter::tags($workspace->tags()->orderBy('name')->get()),
            'ocrUploads' => WorkspaceNotePresenter::uploads($note->ocrUploads),
        ]);
    }

    public function edit(Request $request, Workspace $workspace, Note $note): Response
    {
        $this->ensureEditor($request, $workspace);
        $note = $this->workspaceNote($workspace, $note);

        return Inertia::render('Workspaces/Notes/Edit', [
            'workspace' => $this->workspaceData($request, $workspace),
            'note' => WorkspaceNotePresenter::note($note),
            'tags' => WorkspaceNotePresenter::tags($workspace->tags()->orderBy('name')->get()),
            'ocrUploads' => WorkspaceNotePresenter::uploads($request->user()->ocrUploads()->latest()->limit(1)->get()),
        ]);
    }

    public function update(UpdateWorkspaceNoteRequest $request, Workspace $workspace, Note $note): RedirectResponse|JsonResponse
    {
        $note = $this->workspaceNote($workspace, $note);
        $validated = $request->validated();

        $note->update([
            'title' => $validated['title'],
            'content' => $validated['content'] ?? null,
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
        ]);

        $note->tags()->sync($validated['tag_ids'] ?? []);

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Saved.']);
        }

        return redirect()
            ->route('workspaces.notes.show', [$workspace, $note])
            ->with('success', 'Shared note updated successfully.');
    }

    public function destroy(Request $request, Workspace $workspace, Note $note): RedirectResponse
    {
        $this->ensureEditor($request, $workspace);
        $note = $this->workspaceNote($workspace, $note);
        $note->update(['permanently_delete_at' => now()->addDays(30)]);
        $note->delete();

        return redirect()
            ->route('workspaces.notes.index', $workspace)
            ->with('success', 'Shared note moved to trash.');
    }

    public function togglePin(Request $request, Workspace $workspace, Note $note): RedirectResponse
    {
        $this->ensureEditor($request, $workspace);
        $note = $this->workspaceNote($workspace, $note);
        $validated = $request->validate(['is_pinned' => ['nullable', 'boolean']]);

        $note->update([
            'is_pinned' => array_key_exists('is_pinned', $validated)
                ? (bool) $validated['is_pinned']
                : ! $note->is_pinned,
        ]);

        return back()->with('success', $note->is_pinned ? 'Shared note pinned.' : 'Shared note unpinned.');
    }

    private function workspaceNote(Workspace $workspace, Note $note): Note
    {
        return $workspace->notes()->with(['tags', 'ocrUploads'])->findOrFail($note->id);
    }

    private function resolveFilters(Request $request, Workspace $workspace): array
    {
        $search = trim((string) $request->input('search', ''));
        $sort = $request->input('sort') === 'oldest' ? 'oldest' : 'newest';
        $tagId = null;

        if ($request->filled('tag')) {
            $candidate = (int) $request->input('tag');
            $tagId = $workspace->tags()->whereKey($candidate)->exists() ? $candidate : null;
        }

        return [$search, $tagId, $sort];
    }

    private function applyListFilters($query, string $search, ?int $tagId, string $sort)
    {
        if ($search !== '') {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($tagId) {
            $query->whereHas('tags', fn ($tagQuery) => $tagQuery->whereKey($tagId));
        }

        return $sort === 'oldest' ? $query->oldest('updated_at') : $query->latest('updated_at');
    }

    private function workspaceData(Request $request, Workspace $workspace): array
    {
        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'description' => $workspace->description,
            'role' => $workspace->roleFor($request->user()),
            'can_edit' => $workspace->canEdit($request->user()),
            'is_owner' => $workspace->isOwner($request->user()),
        ];
    }

    private function ensureMember(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->hasMember($request->user()), 403);
    }

    private function ensureEditor(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->canEdit($request->user()), 403);
    }
}
