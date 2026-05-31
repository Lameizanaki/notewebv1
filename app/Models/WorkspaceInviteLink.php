<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WorkspaceInviteLink extends Model
{
    protected $fillable = [
        'role',
        'token',
        'token_hash',
    ];

    protected function casts(): array
    {
        return [
            'token' => 'encrypted',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public static function issue(Workspace $workspace, string $role): self
    {
        $token = Str::random(64);

        return $workspace->inviteLinks()->updateOrCreate(
            ['role' => $role],
            [
                'token' => $token,
                'token_hash' => hash('sha256', $token),
            ],
        );
    }

    public function url(): string
    {
        return route('workspace-invites.accept', $this->token);
    }
}
