<?php

namespace App\Http\Controllers;

use App\Traits\ValidateEmployeeExistenceTrait;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\ChemicalSDS;
use Illuminate\Validation\Rule;

class ChemicalSDSController extends Controller
{
  // public function index(Request $request)
  // {
  //   $search = $request->input('search', '');
  //   $perPage = $request->input('perPage', 10);
  //   $status = $request->input('status', null);
  //   $totalEntries = ChemicalSDS::count();

  //   $chemicalSDS = ChemicalSDS::query()
  //     ->with('chemical')
  //     ->when($search, function ($query, $search) {
  //       $query->orWhereHas('chemical', function ($rel) use ($search) {
  //         $rel->where('name', 'like', "%{$search}%");
  //       });
  //     })
  //     ->when($status, function ($query, $status) {
  //       $query->where('status', $status);
  //     })
  //     ->orderBy('check_date')
  //     ->paginate($perPage)
  //     ->withQueryString();

  //   return Inertia::render('ChemicalSDSList', [
  //     'chemicalSDS' => $chemicalSDS,
  //     'search' => $search,
  //     'perPage' => $perPage,
  //     'totalEntries' => $totalEntries,
  //   ]);
  // }

  private function validateEntry(Request $request, $id = null)
  {
    return $request->validate([
      'chemical_id' => 'required|int',
      'check_date' => 'required|date',
      'status' => ['required', Rule::in(['updated', 'obsolete'])],
      'remarks' => 'nullable|string',
    ]);
  }

  public function store(Request $request)
  {
    $validated = $this->validateEntry($request);
    $entry = ChemicalSDS::create($validated);

    return response()->json([
      'message' => 'Entry added successfully',
      'data' => $entry,
    ]);
  }

  public function upsert($id = null)
  {
    $chemicalToBeEdit = $id ? ChemicalSDS::findOrFail($id) : null;

    return Inertia::render('ChemicalUpsert', [
      'toBeEdit' => $chemicalToBeEdit,
    ]);
  }

  public function update(Request $request, $id)
  {
    $chemicalSDS = ChemicalSDS::findOrFail($id);

    $validated = $this->validateEntry($request, $id);
    $chemicalSDS->update($validated);

    return response()->json([
      'message' => 'Entry updated successfully',
      'data' => $chemicalSDS,
    ]);
  }

  public function destroy($id)
  {
    $entry = ChemicalSDS::findOrFail($id);
    $entry->delete();

    return response()->json([
      'success' => true,
      'message' => 'Entry deleted successfully',
    ]);
  }
}
