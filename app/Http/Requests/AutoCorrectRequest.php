<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AutoCorrectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:20000'],
            'language' => ['nullable', 'string', 'max:20'],
        ];
    }
}
