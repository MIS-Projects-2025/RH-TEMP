<?php

namespace App\Observers;

use App\Models\Checklist;
use Illuminate\Support\Facades\Cache;
use App\Support\CacheKeys;

class ChecklistObserver
{
    /**
     * Handle the Checklist "created" event.
     */
    public function created(Checklist $checklist): void
    {
        Cache::forget(CacheKeys::checklistsAll());
    }

    /**
     * Handle the Checklist "updated" event.
     */
    public function updated(Checklist $checklist): void
    {
        Cache::forget(CacheKeys::checklistsAll());
    }

    /**
     * Handle the Checklist "deleted" event.
     */
    public function deleted(Checklist $checklist): void
    {
        Cache::forget(CacheKeys::checklistsAll());
    }

    /**
     * Handle the Checklist "restored" event.
     */
    public function restored(Checklist $checklist): void
    {
        //
    }

    /**
     * Handle the Checklist "force deleted" event.
     */
    public function forceDeleted(Checklist $checklist): void
    {
        //
    }
}
