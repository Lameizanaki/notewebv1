<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Workspace;
use App\Support\NoteSearch;
use App\Support\WorkspaceNotePresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrashController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $sort = $request->input('sort') === 'oldest' ? 'oldest' : 'newest';

        $notesQuery = $request->user()
            ->notes()
            ->whereNull('workspace_id')
            ->onlyTrashed()
            ->with('tags');

        NoteSearch::applyTitle($notesQuery, $search);

        $notes = ($sort === 'oldest'
            ? $notesQuery->oldest('deleted_at')
            : $notesQuery->latest('deleted_at'))
            ->get()
            ->map(function (Note $note) {
                $daysRemaining = $note->permanently_delete_at
                    ? max(0, now()->startOfDay()->diffInDays($note->permanently_delete_at->copy()->startOfDay(), false))
                    : null;

                return [
                    'id' => $note->id,
                    'title' => $note->title,
                    'deleted_at' => optional($note->deleted_at)?->toIso8601String(),
                    'days_remaining' => $daysRemaining,
                    'permanently_delete_at' => optional($note->permanently_delete_at)?->toIso8601String(),
                    'tags' => $note->tags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'name' => $tag->name,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Trash', [
            'filters' => [
                'search' => $search,
                'sort' => $sort,
            ],
            'notes' => $notes,
            'workspaces' => $request->user()
                ->workspaces()
                ->orderBy('name')
                ->get()
                ->map(fn (Workspace $workspace) => $this->transformWorkspaceTrash($request, $workspace, $search, $sort))
                ->values()
                ->all(),
        ]);
    }

    public function restore(Request $request, int $note): RedirectResponse
    {
        $note = $this->ownedTrashedNote($request, $note);
        $note->restore();
        $note->update(['permanently_delete_at' => null]);

        return back()->with('success', 'Note restored successfully.');
    }

    public function destroy(Request $request, int $note): RedirectResponse
    {
        $note = $this->ownedTrashedNote($request, $note);
        $note->forceDelete();

        return back()->with('success', 'Note permanently deleted.');
    }

    private function ownedTrashedNote(Request $request, int $noteId): Note
    {
        return $request->user()
            ->notes()
            ->whereNull('workspace_id')
            ->withTrashed()
            ->whereNotNull('deleted_at')
            ->findOrFail($noteId);
    }

    private function transformWorkspaceTrash(Request $request, Workspace $workspace, string $search, string $sort): array
    {
        $notesQuery = $workspace->notes()->onlyTrashed()->with(['tags', 'ocrUploads']);
        NoteSearch::applyTitle($notesQuery, $search);

        $notes = ($sort === 'oldest' ? $notesQuery->oldest('deleted_at') : $notesQuery->latest('deleted_at'))
            ->get()
            ->map(fn (Note $note) => [
                ...WorkspaceNotePresenter::snapshot($note),
                'deleted_at' => optional($note->deleted_at)?->toIso8601String(),
                'days_remaining' => $this->daysRemaining($note),
            ])
            ->values()
            ->all();

        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'role' => $workspace->roleFor($request->user()),
            'can_edit' => $workspace->canEdit($request->user()),
            'is_owner' => $workspace->isOwner($request->user()),
            'notes' => $notes,
        ];
    }

    private function daysRemaining(Note $note): ?int
    {
        return $note->permanently_delete_at
            ? max(0, now()->startOfDay()->diffInDays($note->permanently_delete_at->copy()->startOfDay(), false))
            : null;
    }
}
