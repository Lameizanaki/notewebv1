<?php

namespace App\Console\Commands;

use App\Models\Note;
use Illuminate\Console\Command;

class PurgeExpiredTrashedNotes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notes:purge-expired-trash';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete notes whose 30-day trash retention period has expired.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $deletedCount = Note::onlyTrashed()
            ->whereNotNull('permanently_delete_at')
            ->where('permanently_delete_at', '<=', now())
            ->forceDelete();

        $this->info("Purged {$deletedCount} expired trashed notes.");

        return self::SUCCESS;
    }
}
