<?php

namespace App\Support;

class CacheKeys
{
  public static function checklistsAll(): string
  {
    return 'all_checklists';
  }

  public static function locationsAll(): string
  {
    return 'all_locations';
  }

  public static function defaultCacheDuration(): int
  {
    return 60 * 60;
  }
}
