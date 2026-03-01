<?php

namespace App\Constants;

use Illuminate\Support\Facades\DB;

class DueScheduleQuery
{
  public const dailySchedule = "
  (
    s.recurrence_type = 'daily'
    AND s.interval_unit = 'day'
    AND s.day_times IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM JSON_TABLE(
            s.day_times,
            '$[*]' COLUMNS (
                t TIME PATH '$'
            )
        ) jt
        WHERE
            TIMESTAMP(CURDATE(), jt.t) <= NOW()
            AND (cir.checked_at IS NULL OR cir.checked_at < TIMESTAMP(CURDATE(), jt.t))
    )
  )";

  public const intervalHour = "
  (
    s.recurrence_type = 'interval' AND s.interval_unit = 'hour'
    AND (cir.checked_at IS NULL OR TIMESTAMPDIFF(HOUR, cir.checked_at, NOW()) >= s.interval_value)
  )";

  public const intervalMonth = "
  (
    s.recurrence_type = 'interval' AND s.interval_unit = 'month'
    AND (cir.checked_at IS NULL OR PERIOD_DIFF(EXTRACT(YEAR_MONTH FROM CURDATE()), EXTRACT(YEAR_MONTH FROM DATE(cir.checked_at))) >= s.interval_value)
  )";

  public const intervalWeek = "
  (
    s.recurrence_type = 'interval' AND s.interval_unit = 'week'
    AND (cir.checked_at IS NULL OR FLOOR(DATEDIFF(CURDATE(), DATE(cir.checked_at))/7) >= s.interval_value)
  )";

  public const intervalDay = "
  (
    s.recurrence_type = 'interval' AND s.interval_unit = 'day' 
    AND (cir.checked_at IS NULL OR DATEDIFF(CURDATE(), DATE(cir.checked_at)) >= s.interval_value)
  )";

  public const overdueDailySchedule = "
    (
        s.recurrence_type = 'daily'
        AND s.interval_unit = 'day'
        AND s.day_times IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM JSON_TABLE(
                s.day_times,
                '$[*]' COLUMNS (
                    t TIME PATH '$'
                )
            ) jt
            WHERE
                TIMESTAMP(CURDATE(), jt.t) < NOW()
                AND (cir.checked_at IS NULL OR cir.checked_at < TIMESTAMP(CURDATE(), jt.t))
        )
    )";

  public const overdueIntervalHour = "
    (
        s.recurrence_type = 'interval' AND s.interval_unit = 'hour'
        AND (cir.checked_at IS NOT NULL AND TIMESTAMPDIFF(HOUR, cir.checked_at, NOW()) > s.interval_value)
    )";

  public const overdueIntervalMonth = "
    (
        s.recurrence_type = 'interval' AND s.interval_unit = 'month'
        AND (cir.checked_at IS NOT NULL AND PERIOD_DIFF(EXTRACT(YEAR_MONTH FROM CURDATE()), EXTRACT(YEAR_MONTH FROM DATE(cir.checked_at))) > s.interval_value)
    )";

  public const overdueIntervalWeek = "
    (
        s.recurrence_type = 'interval' AND s.interval_unit = 'week'
        AND (cir.checked_at IS NOT NULL AND FLOOR(DATEDIFF(CURDATE(), DATE(cir.checked_at))/7) > s.interval_value)
    )";

  public const overdueIntervalDay = "
    (
        s.recurrence_type = 'interval' AND s.interval_unit = 'day'
        AND (cir.checked_at IS NOT NULL AND DATEDIFF(CURDATE(), DATE(cir.checked_at)) > s.interval_value)
    )";

  public static function dueRaw(string $alias = 'is_due'): \Illuminate\Database\Query\Expression
  {
    return DB::raw("
            CASE
                WHEN " . self::intervalDay . " THEN 1
                WHEN " . self::intervalWeek . " THEN 1
                WHEN " . self::intervalMonth . " THEN 1
                WHEN " . self::intervalHour . " THEN 1
                WHEN " . self::dailySchedule . " THEN 1
                ELSE 0
            END as {$alias}
        ");
  }

  public static function overdueRaw(string $alias = 'is_overdue'): \Illuminate\Database\Query\Expression
  {
    return DB::raw("
            CASE
                WHEN " . self::overdueIntervalDay . " THEN 1
                WHEN " . self::overdueIntervalWeek . " THEN 1
                WHEN " . self::overdueIntervalMonth . " THEN 1
                WHEN " . self::overdueIntervalHour . " THEN 1
                WHEN " . self::overdueDailySchedule . " THEN 1
                ELSE 0
            END as {$alias}
        ");
  }

  public static function dueCondition(): string
  {
    return sprintf(
      '(%s OR %s OR %s OR %s OR %s)',
      self::intervalDay,
      self::intervalWeek,
      self::intervalMonth,
      self::intervalHour,
      self::dailySchedule
    );
  }

  public static function overdueCondition(): string
  {
    return sprintf(
      '(%s OR %s OR %s OR %s OR %s)',
      self::overdueIntervalDay,
      self::overdueIntervalWeek,
      self::overdueIntervalMonth,
      self::overdueIntervalHour,
      self::overdueDailySchedule
    );
  }
}
