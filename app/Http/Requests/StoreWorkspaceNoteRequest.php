<?php

namespace App\Http\Requests;

use App\Models\Workspace;
use App\Support\NoteContentSanitizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkspaceNoteRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'content' => NoteContentSanitizer::sanitize($this->input('content')),
        ]);
    }

    public function authorize(): bool
    {
        $workspace = $this->route('workspace');

        return $workspace instanceof Workspace
            && $this->user() !== null
            && $workspace->canEdit($this->user());
    }

    public function rules(): array
    {
        /** @var Workspace $workspace */
        $workspace = $this->route('workspace');

        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'is_pinned' => ['nullable', 'boolean'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(
                    fn ($query) => $query->where('workspace_id', $workspace->id)
                ),
            ],
        ];
    }
}
