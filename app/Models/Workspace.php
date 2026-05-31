<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    public const ROLE_OWNER = 'owner';

    public const ROLE_EDITOR = 'editor';

    public const ROLE_VIEWER = 'viewer';

    protected $fillable = [
        'owner_id',
        'name',
        'description',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    public function inviteLinks(): HasMany
    {
        return $this->hasMany(WorkspaceInviteLink::class);
    }

    public function roleFor(User $user): ?string
    {
        if ($this->owner_id === $user->id) {
            return self::ROLE_OWNER;
        }

        return $this->members()
            ->whereKey($user->id)
            ->value('workspace_user.role');
    }

    public function hasMember(User $user): bool
    {
        return $this->roleFor($user) !== null;
    }

    public function canEdit(User $user): bool
    {
        return in_array($this->roleFor($user), [self::ROLE_OWNER, self::ROLE_EDITOR], true);
    }

    public function isOwner(User $user): bool
    {
        return $this->owner_id === $user->id;
    }
}
