<?php

return [
    'driver' => env('AUTOCORRECT_DRIVER', 'languagetool'),
    'language' => env('AUTOCORRECT_LANGUAGE', 'en-US'),
    'fallback_to_local' => env('AUTOCORRECT_FALLBACK_TO_LOCAL', true),
];
