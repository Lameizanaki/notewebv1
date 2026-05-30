<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

class UniqueUsername
{
    public static function make(string $seed): string
    {
        $base = Str::lower(Str::slug($seed, '_'));

        if ($base === '') {
            $base = 'user';
        }

        $username = $base;
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
            $username = "{$base}_{$suffix}";
            $suffix++;
        }

        return $username;
    }
}
