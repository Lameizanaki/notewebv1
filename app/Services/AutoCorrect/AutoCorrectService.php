<?php

namespace App\Services\AutoCorrect;

interface AutoCorrectService
{
    public function correct(string $text, ?string $language = null): AutoCorrectResult;
}
