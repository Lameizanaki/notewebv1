<?php

namespace Tests\Feature;

use App\Models\OcrUpload;
use App\Models\User;
use App\Services\Ocr\OcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class OcrUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_image_upload_extracts_text_and_saves_the_result(): void
    {
        Storage::fake('public');

        $ocrService = Mockery::mock(OcrService::class);
        $ocrService
            ->shouldReceive('extractText')
            ->once()
            ->andReturn('Scanned line one');

        $this->app->instance(OcrService::class, $ocrService);

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/notes/create')
            ->post(route('ocr-uploads.store'), [
                'file' => UploadedFile::fake()->create('receipt.jpg', 128, 'image/jpeg'),
            ]);

        $response
            ->assertRedirect('/notes/create')
            ->assertSessionHasNoErrors();

        $upload = OcrUpload::query()->sole();

        $this->assertSame($user->id, $upload->user_id);
        $this->assertSame('jpg', $upload->file_type);
        $this->assertSame('Scanned line one', $upload->extracted_text);
        Storage::disk('public')->assertExists($upload->file_path);
    }

    public function test_pdf_upload_uses_file_input_and_saves_the_result(): void
    {
        Storage::fake('public');

        $ocrService = Mockery::mock(OcrService::class);
        $ocrService
            ->shouldReceive('extractText')
            ->once()
            ->andReturn('PDF body text');

        $this->app->instance(OcrService::class, $ocrService);

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/notes/create')
            ->post(route('ocr-uploads.store'), [
                'file' => UploadedFile::fake()->create('scan.pdf', 256, 'application/pdf'),
            ]);

        $response
            ->assertRedirect('/notes/create')
            ->assertSessionHasNoErrors();

        $upload = OcrUpload::query()->sole();

        $this->assertSame('pdf', $upload->file_type);
        $this->assertSame('PDF body text', $upload->extracted_text);
    }

    public function test_new_upload_replaces_previous_ocr_history(): void
    {
        Storage::fake('public');

        $ocrService = Mockery::mock(OcrService::class);
        $ocrService
            ->shouldReceive('extractText')
            ->once()
            ->andReturn('Fresh OCR text');

        $this->app->instance(OcrService::class, $ocrService);

        $user = User::factory()->create();
        Storage::disk('public')->put('ocr-uploads/old-upload.png', 'old file');

        OcrUpload::query()->create([
            'user_id' => $user->id,
            'note_id' => null,
            'file_path' => 'ocr-uploads/old-upload.png',
            'file_type' => 'png',
            'extracted_text' => 'Old OCR text',
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/notes/create')
            ->post(route('ocr-uploads.store'), [
                'file' => UploadedFile::fake()->create('fresh.png', 128, 'image/png'),
            ]);

        $response
            ->assertRedirect('/notes/create')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('ocr_uploads', 1);
        $upload = OcrUpload::query()->sole();

        $this->assertSame('Fresh OCR text', $upload->extracted_text);
        Storage::disk('public')->assertMissing('ocr-uploads/old-upload.png');
    }

    public function test_upload_returns_an_error_when_ocr_is_not_configured(): void
    {
        Storage::fake('public');

        $ocrService = Mockery::mock(OcrService::class);
        $ocrService
            ->shouldReceive('extractText')
            ->once()
            ->andThrow(new RuntimeException('Tesseract OCR is not installed. Install Tesseract and set OCR_TESSERACT_PATH if it is not on your PATH.'));

        $this->app->instance(OcrService::class, $ocrService);

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/notes/create')
            ->post(route('ocr-uploads.store'), [
                'file' => UploadedFile::fake()->create('receipt.jpg', 128, 'image/jpeg'),
            ]);

        $response
            ->assertRedirect('/notes/create')
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('ocr_uploads', 0);
    }
}
