<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteRichTextTest extends TestCase
{
    use RefreshDatabase;

    public function test_note_content_is_sanitized_when_creating_a_note(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('notes.store'), [
                'title' => 'Rich note',
                'content' => '<h1>Hello</h1><script>alert(1)</script><p onclick="evil()">World</p><b>Bold</b>',
                'is_pinned' => false,
                'tag_ids' => [],
            ]);

        $note = Note::query()->sole();

        $response->assertRedirect(route('notes.show', $note));
        $this->assertSame('<h2>Hello</h2><p>World</p><strong>Bold</strong>', $note->content);
    }

    public function test_plain_text_is_normalized_to_html_when_saving(): void
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user)
            ->post(route('notes.store'), [
                'title' => 'Plain note',
                'content' => "First line\n\nSecond line",
                'is_pinned' => false,
                'tag_ids' => [],
            ]);

        $note = Note::query()->sole();

        $this->assertSame('<p>First line</p><p>Second line</p>', $note->content);
    }
}
