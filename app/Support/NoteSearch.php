<?php

namespace App\Support;

use Illuminate\Support\Str;

class NoteSearch
{
    public static function applyTitle($query, string $search)
    {
        if ($search === '') {
            return $query;
        }

        return $query->whereRaw('LOWER(title) LIKE ?', ['%'.Str::lower($search).'%']);
    }
}
