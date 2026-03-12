<?php

namespace App\Constants;

class DeviceTempThresholdConstants
{
  const PL3_LOCATIONS = ['PL3 Production', 'PL3 Batching', 'PL3 Boxing'];

  const STANDARD = [
    'temp_min' => 20.0,
    'temp_max' => 25.1,
    'rh_min'   => 49.0,
    'rh_max'   => 60.0,
  ];

  const PL3 = [
    'temp_min' => 18.0,
    'temp_max' => 24.1,
    'rh_min'   => 45.0,
    'rh_max'   => 60.0,
  ];
}
