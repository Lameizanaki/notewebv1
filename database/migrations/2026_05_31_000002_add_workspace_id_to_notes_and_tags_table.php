<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->foreignId('workspace_id')->nullable()->after('user_id')->constrained()->cascadeOnDelete();
            $table->index(['workspace_id', 'is_pinned']);
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'name']);
            $table->foreignId('workspace_id')->nullable()->after('user_id')->constrained()->cascadeOnDelete();
            $table->unique(['workspace_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workspace_id');
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->dropUnique(['workspace_id', 'name']);
            $table->dropConstrainedForeignId('workspace_id');
            $table->unique(['user_id', 'name']);
        });
    }
};
