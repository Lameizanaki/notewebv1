<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttachTagRequest;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Models\Note;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $baseQuery = $request->user()->notes()->whereNull('workspace_id')->with('tags');

        if ($search !== '') {
            $baseQuery->where('title', 'like', "%{$search}%");
        }

        $pinnedNotes = (clone $baseQuery)
            ->where('is_pinned', true)
            ->latest('updated_at')
            ->limit(4)
            ->get();

        $recentNotes = (clone $baseQuery)
            ->latest('updated_at')
            ->limit(8)
            ->get();

        return Inertia::render('Dashboard', [
            'filters' => [
                'search' => $search,
            ],
            'pinnedNotes' => $this->transformNotes($pinnedNotes),
            'recentNotes' => $this->transformNotes($recentNotes),
        ]);
    }

    public function index(Request $request): Response
    {
        [$search, $tagId, $sort] = $this->resolveFilters($request);

        $notes = $this->applyListFilters($request->user()->notes()->whereNull('workspace_id')->with('tags'), $search, $tagId, $sort)->get();

        return Inertia::render('Notes/Index', [
            'filters' => [
                'search' => $search,
                'tag' => $tagId,
                'sort' => $sort,
            ],
            'notes' => $this->transformNotes($notes),
            'tags' => $this->transformTags($request->user()->tags()->whereNull('workspace_id')->orderBy('name')->get()),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Notes/Create', [
            'tags' => $this->transformTags($request->user()->tags()->whereNull('workspace_id')->orderBy('name')->get()),
            'ocrUploads' => $this->transformUploads(
                $request->user()->ocrUploads()->latest()->limit(1)->get()
            ),
        ]);
    }

    public function store(StoreNoteRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $note = $request->user()->notes()->create([
            'title' => $validated['title'],
            'content' => $validated['content'] ?? null,
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
        ]);

        $note->tags()->sync($validated['tag_ids'] ?? []);

        return redirect()
            ->route('notes.show', $note)
            ->with('success', 'Note created successfully.');
    }

    public function show(Request $request, Note $note): Response
    {
        $note = $this->ownedNote($request, $note->id);

        return Inertia::render('Notes/Show', [
            'note' => $this->transformSingleNote($note),
            'tags' => $this->transformTags($request->user()->tags()->whereNull('workspace_id')->orderBy('name')->get()),
            'ocrUploads' => $this->transformUploads(
                $request->user()->ocrUploads()->latest()->limit(1)->get()
            ),
        ]);
    }

    public function edit(Request $request, Note $note): Response
    {
        $note = $this->ownedNote($request, $note->id);

        return Inertia::render('Notes/Edit', [
            'note' => $this->transformSingleNote($note),
            'tags' => $this->transformTags($request->user()->tags()->whereNull('workspace_id')->orderBy('name')->get()),
            'ocrUploads' => $this->transformUploads(
                $request->user()->ocrUploads()->latest()->limit(1)->get()
            ),
        ]);
    }

    public function update(UpdateNoteRequest $request, Note $note): RedirectResponse|JsonResponse
    {
        $note = $this->ownedNote($request, $note->id);
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
            ->route('notes.show', $note)
            ->with('success', 'Note updated successfully.');
    }

    public function destroy(Request $request, Note $note): RedirectResponse
    {
        $note = $this->ownedNote($request, $note->id);

        $note->update([
            'permanently_delete_at' => now()->addDays(30),
        ]);

        $note->delete();

        return redirect()
            ->route('notes.index')
            ->with('success', 'Note moved to trash.');
    }

    public function pinned(Request $request): Response
    {
        [$search, $tagId, $sort] = $this->resolveFilters($request);

        $notes = $this->applyListFilters(
            $request->user()->notes()->whereNull('workspace_id')->with('tags')->where('is_pinned', true),
            $search,
            $tagId,
            $sort,
        )->get();

        return Inertia::render('Pinned', [
            'filters' => [
                'search' => $search,
                'tag' => $tagId,
                'sort' => $sort,
            ],
            'notes' => $this->transformNotes($notes),
            'tags' => $this->transformTags($request->user()->tags()->whereNull('workspace_id')->orderBy('name')->get()),
        ]);
    }

    public function togglePin(Request $request, Note $note): RedirectResponse
    {
        $note = $this->ownedNote($request, $note->id);
        $validated = $request->validate([
            'is_pinned' => ['nullable', 'boolean'],
        ]);

        $note->update([
            'is_pinned' => array_key_exists('is_pinned', $validated)
                ? (bool) $validated['is_pinned']
                : ! $note->is_pinned,
        ]);

        return back()->with(
            'success',
            $note->is_pinned ? 'Note pinned successfully.' : 'Note unpinned successfully.'
        );
    }

    public function attachTag(AttachTagRequest $request, Note $note): RedirectResponse
    {
        $note = $this->ownedNote($request, $note->id);

        $note->tags()->syncWithoutDetaching([$request->validated()['tag_id']]);

        return back()->with('success', 'Tag attached to note.');
    }

    public function detachTag(Request $request, Note $note, Tag $tag): RedirectResponse
    {
        $note = $this->ownedNote($request, $note->id);
        $tag = $request->user()->tags()->whereNull('workspace_id')->findOrFail($tag->id);

        $note->tags()->detach($tag->id);

        return back()->with('success', 'Tag removed from note.');
    }

    private function ownedNote(Request $request, int $noteId): Note
    {
        return $request->user()
            ->notes()
            ->whereNull('workspace_id')
            ->with(['tags', 'ocrUploads'])
            ->findOrFail($noteId);
    }

    private function resolveFilters(Request $request): array
    {
        $search = trim((string) $request->input('search', ''));
        $sort = $request->input('sort') === 'oldest' ? 'oldest' : 'newest';
        $tagId = null;

        if ($request->filled('tag')) {
            $candidate = (int) $request->input('tag');
            $tagId = $request->user()->tags()->whereNull('workspace_id')->whereKey($candidate)->exists() ? $candidate : null;
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

        return $sort === 'oldest'
            ? $query->oldest('updated_at')
            : $query->latest('updated_at');
    }

    private function transformNotes($notes): array
    {
        return $notes->map(fn (Note $note) => [
            'id' => $note->id,
            'title' => $note->title,
            'content' => $note->content,
            'preview' => Str::limit(trim(preg_replace('/\s+/', ' ', strip_tags($note->content ?? ''))), 140),
            'is_pinned' => $note->is_pinned,
            'updated_at' => optional($note->updated_at)?->toIso8601String(),
            'updated_at_human' => optional($note->updated_at)?->diffForHumans(),
            'deleted_at' => optional($note->deleted_at)?->toIso8601String(),
            'tags' => $this->transformTags($note->tags),
        ])->values()->all();
    }

    private function transformSingleNote(Note $note): array
    {
        return [
            'id' => $note->id,
            'title' => $note->title,
            'content' => $note->content,
            'is_pinned' => $note->is_pinned,
            'updated_at' => optional($note->updated_at)?->toIso8601String(),
            'tags' => $this->transformTags($note->tags),
            'ocr_uploads' => $this->transformUploads($note->ocrUploads),
        ];
    }

    private function transformTags($tags): array
    {
        return $tags->map(fn (Tag $tag) => [
            'id' => $tag->id,
            'name' => $tag->name,
        ])->values()->all();
    }

    private function transformUploads($uploads): array
    {
        return $uploads->map(fn ($upload) => [
            'id' => $upload->id,
            'note_id' => $upload->note_id,
            'file_path' => $upload->file_path,
            'file_type' => $upload->file_type,
            'extracted_text' => $upload->extracted_text,
            'created_at' => optional($upload->created_at)?->toIso8601String(),
        ])->values()->all();
    }
}
