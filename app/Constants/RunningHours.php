<?php

namespace App\Constants;

class RunningHours
{
  public const VACUUM_RUNNING_HOURS_MAX         = 4000;
  public const AIR_COMPRESSOR_RUNNING_HOURS_MAX = 8000;

  private const OK_RATIO      = 0.50;
  private const WARNING_RATIO = 0.25;
  private const DANGER_RATIO  = 0.25;

  public const VACUUM_RUNNING_HOURS_OK      = self::VACUUM_RUNNING_HOURS_MAX * self::OK_RATIO;      // 2000
  public const VACUUM_RUNNING_HOURS_WARNING = self::VACUUM_RUNNING_HOURS_MAX * self::WARNING_RATIO; // 1000
  public const VACUUM_RUNNING_HOURS_DANGER  = self::VACUUM_RUNNING_HOURS_MAX * self::DANGER_RATIO;  // 1000

  public const AIR_COMPRESSOR_RUNNING_HOURS_OK      = self::AIR_COMPRESSOR_RUNNING_HOURS_MAX * self::OK_RATIO;      // 4000
  public const AIR_COMPRESSOR_RUNNING_HOURS_WARNING = self::AIR_COMPRESSOR_RUNNING_HOURS_MAX * self::WARNING_RATIO; // 2000
  public const AIR_COMPRESSOR_RUNNING_HOURS_DANGER  = self::AIR_COMPRESSOR_RUNNING_HOURS_MAX * self::DANGER_RATIO;  // 2000
}
