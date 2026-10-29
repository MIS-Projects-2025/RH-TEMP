<?php

namespace App\Http\Controllers;

use App\Exports\DeviceAlertExport;
use App\Models\DeviceAlert;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertExportController extends Controller
{
    private const WITH = ['level', 'previousLevel', 'tempLevel', 'rhLevel'];

    // Matches <input type="datetime-local">.
    private const INPUT_FORMAT = 'Y-m-d\TH:i';

    public function index(Request $request)
    {
        [$from, $to] = $this->range($request);

        $query = DeviceAlert::inRange($from, $to);

        return Inertia::render('AlertExport', [
            'filters' => [
                'from' => $from->format(self::INPUT_FORMAT),
                'to' => $to->format(self::INPUT_FORMAT),
            ],
            'total' => $query->count(),
            'events' => $query->with(self::WITH)
                ->orderByDesc('alerted_at')
                ->limit(50)
                ->get()
                ->map(fn(DeviceAlert $a) => [
                    'id' => $a->id,
                    'alerted_at' => $a->alerted_at->format('Y-m-d H:i:s'),
                    'location' => $a->location ?: $a->device_ip,
                    'level' => $a->level->name,
                    'previous_level' => $a->previousLevel?->name,
                    'temp' => $a->temp,
                    'temp_level' => $a->tempLevel->name,
                    'rh' => $a->rh,
                    'rh_level' => $a->rhLevel->name,
                ]),
        ]);
    }

    public function download(Request $request)
    {
        [$from, $to] = $this->range($request);

        $alerts = DeviceAlert::inRange($from, $to)
            ->with(self::WITH)
            ->orderBy('alerted_at')
            ->get();

        abort_if($alerts->isEmpty(), 404, 'No alerts in the selected range.');

        $path = tempnam(sys_get_temp_dir(), 'alerts_');

        (new DeviceAlertExport)->save($alerts, $path);

        $name = sprintf(
            'device-alerts_%s_%s.xlsx',
            $from->format('Ymd-Hi'),
            $to->format('Ymd-Hi')
        );

        return response()
            ->download($path, $name, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    /** Defaults to the last 7 days. `to` includes the whole minute picked. */
    private function range(Request $request): array
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($data['from'])
            ? Carbon::parse($data['from'])
            : now()->subDays(6)->startOfDay();

        $to = isset($data['to'])
            ? Carbon::parse($data['to'])->endOfMinute()
            : now();

        return [$from, $to];
    }
}
