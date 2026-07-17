<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Bug;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class BugTrackerController extends Controller
{
    public function index()
    {
        $bugs = Bug::with(['developer', 'reporter'])
            ->orderBy('created_at', 'desc')
            ->get();

        $developers = User::where('department', 'Development')
            ->select('id', 'name')
            ->get();

        return Inertia::render('BugTracker/BugIndex', [
            'bugs' => $bugs,
            'developers' => $developers
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|string|in:Low,Medium,High,Critical',
            'severity' => 'required|string|in:Low,Medium,High,Blocker',
            'environment' => 'required|string|max:255',
            'developer_id' => 'nullable|exists:users,id',
            'expected_result' => 'nullable|string',
            'actual_result' => 'nullable|string',
        ]);

        Bug::create(array_merge($validated, [
            'reporter_id' => Auth::id(),
            'status' => 'Open',
        ]));

        return redirect()->route('bugs.index')->with('success', 'Bug ticket reported successfully.');
    }

    public function update(Request $request, Bug $bug)
    {
        $validated = $request->validate([
            'developer_id' => 'nullable|exists:users,id',
            'status' => 'required|string|in:Open,In Progress,Resolved,Closed',
            'resolution' => 'nullable|string',
        ]);

        $bug->update($validated);

        return back()->with('success', 'Bug ticket updated.');
    }
}
