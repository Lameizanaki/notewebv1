<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OcrUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:png,jpg,jpeg,pdf', 'max:10240'],
            'note_id' => [
                'nullable',
                'integer',
                Rule::exists('notes', 'id')->where(
                    fn ($query) => $query
                        ->where('user_id', $this->user()->id)
                        ->whereNull('deleted_at')
                ),
            ],
        ];
    }
}
