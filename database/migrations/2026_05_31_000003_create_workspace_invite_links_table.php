<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_invite_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20);
            $table->text('token');
            $table->string('token_hash', 64)->unique();
            $table->timestamps();

            $table->unique(['workspace_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_invite_links');
    }
};
