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

class WorkspaceTrashController extends Controller
{
    public function index(Request $request, Workspace $workspace): Response
    {
        $this->ensureMember($request, $workspace);
        $search = trim((string) $request->input('search', ''));
        $sort = $request->input('sort') === 'oldest' ? 'oldest' : 'newest';
        $notesQuery = $workspace->notes()->onlyTrashed()->with('tags');

        NoteSearch::applyTitle($notesQuery, $search);

        $notes = ($sort === 'oldest' ? $notesQuery->oldest('deleted_at') : $notesQuery->latest('deleted_at'))
            ->get()
            ->map(fn (Note $note) => [
                ...WorkspaceNotePresenter::note($note),
                'deleted_at' => optional($note->deleted_at)?->toIso8601String(),
                'days_remaining' => $note->permanently_delete_at
                    ? max(0, now()->startOfDay()->diffInDays($note->permanently_delete_at->copy()->startOfDay(), false))
                    : null,
            ])
            ->values()
            ->all();

        return Inertia::render('Workspaces/Trash', [
            'workspace' => $this->workspaceData($request, $workspace),
            'filters' => compact('search', 'sort'),
            'notes' => $notes,
        ]);
    }

    public function restore(Request $request, Workspace $workspace, int $note): RedirectResponse
    {
        $this->ensureEditor($request, $workspace);
        $note = $this->trashedNote($workspace, $note);
        $note->restore();
        $note->update(['permanently_delete_at' => null]);

        return back()->with('success', 'Shared note restored successfully.');
    }

    public function destroy(Request $request, Workspace $workspace, int $note): RedirectResponse
    {
        $this->ensureEditor($request, $workspace);
        $this->trashedNote($workspace, $note)->forceDelete();

        return back()->with('success', 'Shared note permanently deleted.');
    }

    private function trashedNote(Workspace $workspace, int $noteId): Note
    {
        return $workspace->notes()->withTrashed()->whereNotNull('deleted_at')->findOrFail($noteId);
    }

    private function workspaceData(Request $request, Workspace $workspace): array
    {
        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
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
