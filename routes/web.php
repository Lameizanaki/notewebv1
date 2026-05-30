<?php

use App\Http\Controllers\AutoCorrectController;
use App\Http\Controllers\ImproveWritingController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\OcrController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TrashController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Landing', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('landing');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [NoteController::class, 'dashboard'])->name('dashboard');

    Route::get('/notes', [NoteController::class, 'index'])->name('notes.index');
    Route::get('/notes/create', [NoteController::class, 'create'])->name('notes.create');
    Route::post('/notes', [NoteController::class, 'store'])->name('notes.store');
    Route::get('/notes/{note}/edit', [NoteController::class, 'edit'])->name('notes.edit');
    Route::get('/notes/{note}', [NoteController::class, 'show'])->name('notes.show');
    Route::patch('/notes/{note}', [NoteController::class, 'update'])->name('notes.update');
    Route::delete('/notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');
    Route::patch('/notes/{note}/pin', [NoteController::class, 'togglePin'])->name('notes.pin');
    Route::post('/notes/{note}/tags', [NoteController::class, 'attachTag'])->name('notes.tags.attach');
    Route::delete('/notes/{note}/tags/{tag}', [NoteController::class, 'detachTag'])->name('notes.tags.detach');

    Route::get('/pinned', [NoteController::class, 'pinned'])->name('notes.pinned');

    Route::get('/trash', [TrashController::class, 'index'])->name('trash.index');
    Route::patch('/trash/{note}/restore', [TrashController::class, 'restore'])->name('trash.restore');
    Route::delete('/trash/{note}', [TrashController::class, 'destroy'])->name('trash.destroy');

    Route::post('/tags', [TagController::class, 'store'])->name('tags.store');
    Route::patch('/tags/{tag}', [TagController::class, 'update'])->name('tags.update');
    Route::delete('/tags/{tag}', [TagController::class, 'destroy'])->name('tags.destroy');

    Route::post('/ocr-uploads', [OcrController::class, 'store'])->name('ocr-uploads.store');
    Route::post('/auto-correct', AutoCorrectController::class)->name('auto-correct.check');
    Route::post('/improve-writing', ImproveWritingController::class)->name('improve-writing.store');

    Route::get('/settings', [ProfileController::class, 'edit'])->name('settings.edit');
    Route::patch('/settings', [ProfileController::class, 'update'])->name('settings.update');
    Route::delete('/settings', [ProfileController::class, 'destroy'])->name('settings.destroy');
});

require __DIR__.'/auth.php';
