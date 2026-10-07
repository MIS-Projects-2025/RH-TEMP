<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\ThresholdProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ThresholdProfileController extends Controller
{
  public function index()
  {
    return Inertia::render('ThresholdProfiles/Index', [
      'devices'  => Device::with('thresholdProfile')->orderBy('location')->get(),
      'profiles' => ThresholdProfile::all(),
    ]);
  }

  public function assignToDevice(Request $request, Device $device)
  {
    $request->validate([
      'threshold_profile_id' => 'required|exists:threshold_profiles,id',
    ]);

    $device->update(['threshold_profile_id' => $request->threshold_profile_id]);
    Log::info("Device {$device->id} assigned profile {$request->threshold_profile_id}");

    return back();
  }

  private function rules(): array
  {
    return [
      'temp_min'      => 'required|numeric',
      'temp_max'      => 'required|numeric|gt:temp_min',
      'temp_crit_min' => 'nullable|numeric|lte:temp_min',
      'temp_crit_max' => 'nullable|numeric|gte:temp_max',
      'rh_min'        => 'required|numeric',
      'rh_max'        => 'required|numeric|gt:rh_min',
      'rh_crit_min'   => 'nullable|numeric|lte:rh_min',
      'rh_crit_max'   => 'nullable|numeric|gte:rh_max',
    ];
  }

  private const FIELDS = [
    'temp_min',
    'temp_max',
    'temp_crit_min',
    'temp_crit_max',
    'rh_min',
    'rh_max',
    'rh_crit_min',
    'rh_crit_max',
  ];

  public function update(Request $request, ThresholdProfile $profile)
  {
    $request->validate($this->rules());
    $profile->update($request->only(self::FIELDS));
    return back();
  }

  public function store(Request $request)
  {
    $request->validate(['name' => 'required|string|unique:threshold_profiles,name'] + $this->rules());
    ThresholdProfile::create($request->only(['name', ...self::FIELDS]));
    return back();
  }
}
