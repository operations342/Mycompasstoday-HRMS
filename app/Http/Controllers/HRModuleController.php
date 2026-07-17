<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\HRRecord;
use App\Models\User;
use App\Models\Designation;
use Illuminate\Support\Facades\Auth;

class HRModuleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Directory
        $directory = User::with('designation')->select('id', 'name', 'email', 'role', 'department', 'phone', 'avatar', 'designation_id')->get();
        $designations = Designation::orderBy('name')->get();

        // 2. Leave requests
        if (in_array($user->role, ['Super Admin', 'Admin', 'Manager'])) {
            $leaves = HRRecord::with('user')
                ->where('record_type', 'Leave Request')
                ->orderBy('created_at', 'desc')
                ->get();

            $reviews = HRRecord::with(['user', 'reviewer'])
                ->where('record_type', 'Performance Review')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $leaves = HRRecord::with('user')
                ->where('record_type', 'Leave Request')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $reviews = HRRecord::with(['user', 'reviewer'])
                ->where('record_type', 'Performance Review')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // 3. Attendance (last 30 logs for current user)
        $attendance = HRRecord::where('record_type', 'Attendance')
            ->where('user_id', $user->id)
            ->orderBy('date_from', 'desc')
            ->limit(30)
            ->get();

        return Inertia::render('HRAccounts/HRArea', [
            'directory' => $directory,
            'designations' => $designations,
            'leaves' => $leaves,
            'reviews' => $reviews,
            'attendance' => $attendance,
        ]);
    }

    public function submitLeave(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
            'details' => 'required|string',
        ]);

        HRRecord::create([
            'record_type' => 'Leave Request',
            'user_id' => Auth::id(),
            'date_from' => $validated['date_from'],
            'date_to' => $validated['date_to'],
            'details' => $validated['details'],
            'status' => 'Pending',
        ]);

        return back()->with('success', 'Leave request submitted.');
    }

    public function approveLeave(Request $request, HRRecord $record)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Approved,Rejected'
        ]);

        $record->update([
            'status' => $validated['status'],
            'reviewer_id' => Auth::id(),
        ]);

        return back()->with('success', "Leave request status updated to {$validated['status']}.");
    }

    public function submitReview(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'score' => 'required|integer|min:1|max:100',
            'details' => 'required|string',
        ]);

        HRRecord::create([
            'record_type' => 'Performance Review',
            'user_id' => $validated['user_id'],
            'score' => $validated['score'],
            'details' => $validated['details'],
            'reviewer_id' => Auth::id(),
            'status' => 'Approved',
        ]);

        return back()->with('success', 'Performance review submitted.');
    }

    public function clockInOut(Request $request)
    {
        $today = now()->toDateString();
        
        $log = HRRecord::where('record_type', 'Attendance')
            ->where('user_id', Auth::id())
            ->whereDate('date_from', $today)
            ->first();

        if ($log) {
            // Clock out
            $log->update([
                'status' => 'Present',
                'details' => $log->details . ' | Clocked out at ' . now()->toTimeString(),
            ]);
            $msg = 'Clocked out successfully.';
        } else {
            // Clock in
            HRRecord::create([
                'record_type' => 'Attendance',
                'user_id' => Auth::id(),
                'date_from' => $today,
                'date_to' => $today,
                'status' => 'Present',
                'details' => 'Clocked in at ' . now()->toTimeString(),
            ]);
            $msg = 'Clocked in successfully.';
        }

        return back()->with('success', $msg);
    }

    public function storeUser(Request $request)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'department' => 'required|string',
            'phone' => 'nullable|string|max:255',
            'designation_id' => 'nullable|exists:designations,id',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'],
            'department' => $validated['department'],
            'phone' => $validated['phone'] ?? null,
            'designation_id' => $validated['designation_id'] ?? null,
        ]);

        return back()->with('success', 'Employee added successfully.');
    }

    public function updateUser(Request $request, User $user)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|string',
            'department' => 'required|string',
            'phone' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8',
            'designation_id' => 'nullable|exists:designations,id',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'department' => $validated['department'],
            'phone' => $validated['phone'] ?? null,
            'designation_id' => $validated['designation_id'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = bcrypt($validated['password']);
        }

        $user->update($updateData);

        return back()->with('success', 'Employee updated successfully.');
    }

    public function destroyUser($id)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin'])) {
            return abort(403, 'Unauthorized action.');
        }

        $user = User::find($id);

        if (!$user) {
            return back()->with('success', 'Employee removed successfully.');
        }

        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot delete yourself!']);
        }

        $user->delete();

        return back()->with('success', 'Employee removed successfully.');
    }

    public function storeDesignation(Request $request)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:designations',
        ]);

        Designation::create([
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Role/Designation added successfully.');
    }

    public function updateDesignation(Request $request, Designation $designation)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:designations,name,' . $designation->id,
        ]);

        $designation->update([
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Role/Designation updated successfully.');
    }

    public function destroyDesignation(Designation $designation)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $designation->delete();

        return back()->with('success', 'Role/Designation deleted successfully.');
    }
}
