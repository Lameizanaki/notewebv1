<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function store(StoreTagRequest $request): RedirectResponse
    {
        $request->user()->tags()->create([
            ...$request->validated(),
            'workspace_id' => null,
        ]);

        return back()->with('success', 'Tag created successfully.');
    }

    public function update(UpdateTagRequest $request, Tag $tag): RedirectResponse
    {
        $tag = $request->user()->tags()->whereNull('workspace_id')->findOrFail($tag->id);
        $tag->update($request->validated());

        return back()->with('success', 'Tag renamed successfully.');
    }

    public function destroy(Request $request, Tag $tag): RedirectResponse
    {
        $tag = $request->user()->tags()->whereNull('workspace_id')->findOrFail($tag->id);
        $tag->notes()->detach();
        $tag->delete();

        return back()->with('success', 'Tag deleted successfully.');
    }
}
