<?php

namespace App\Support;

use App\Models\Note;
use App\Models\Tag;
use Illuminate\Support\Str;

class WorkspaceNotePresenter
{
    public static function notes($notes): array
    {
        return $notes->map(fn (Note $note) => [
            'id' => $note->id,
            'title' => $note->title,
            'content' => $note->content,
            'preview' => Str::limit(trim(preg_replace('/\s+/', ' ', strip_tags($note->content ?? ''))), 140),
            'is_pinned' => $note->is_pinned,
            'updated_at' => optional($note->updated_at)?->toIso8601String(),
            'tags' => self::tags($note->tags),
        ])->values()->all();
    }

    public static function note(Note $note): array
    {
        return [
            'id' => $note->id,
            'title' => $note->title,
            'content' => $note->content,
            'is_pinned' => $note->is_pinned,
            'updated_at' => optional($note->updated_at)?->toIso8601String(),
            'tags' => self::tags($note->tags),
            'ocr_uploads' => self::uploads($note->ocrUploads),
        ];
    }

    public static function tags($tags): array
    {
        return $tags->map(fn (Tag $tag) => [
            'id' => $tag->id,
            'name' => $tag->name,
        ])->values()->all();
    }

    public static function uploads($uploads): array
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
