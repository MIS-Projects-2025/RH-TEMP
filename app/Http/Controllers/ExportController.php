<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller as BaseController;
use App\Models\ExportJob;
use App\Jobs\ProcessRecordingsExport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Inertia;

class ExportController extends BaseController
{
    public function index()
    {
        return Inertia::render('ExportRecordings');
    }

    public function dispatch(Request $request): JsonResponse
    {
        $userId = session('emp_data')['emp_id'];

        $validated = $request->validate([
            'date'   => ['required', 'date'],
            'period' => ['required', Rule::in(['day', 'week', 'month', 'year'])],
        ]);

        $periodMap = ['day' => 1, 'week' => 2, 'month' => 3, 'year' => 4];

        $job = ExportJob::create([
            'requested_by' => $userId,
            'params'       => [
                'date'   => $validated['date'],
                'period' => $periodMap[$validated['period']],
            ],
            'status' => 'pending',
        ]);

        ProcessRecordingsExport::dispatch($job);

        return response()->json(['job_id' => $job->id], 202);
    }

    // GET /export/{job}/status
    public function status(ExportJob $job): JsonResponse
    {
        return response()->json([
            'status'   => $job->status,
            'progress' => $job->progress,
            'file_url' => $job->file_url,
            'error'    => $job->error,
        ]);
    }

    // GET /export/{job}/download
    public function download(ExportJob $job): BinaryFileResponse|JsonResponse
    {
        if ($job->status !== 'done' || !$job->file_path) {
            return response()->json(['error' => 'File not ready.'], 404);
        }

        $fullPath = storage_path('app/' . $job->file_path);

        if (!file_exists($fullPath)) {
            return response()->json(['error' => 'File missing.'], 404);
        }

        return response()->download($fullPath);
    }
}
