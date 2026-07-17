<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SubscriptionRenewal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of subscriptions with search and status filters.
     */
    public function index(Request $request)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        // 1. Auto-update status for all active/expiring/expired subscriptions on load
        $this->autoUpdateStatuses();

        // 2. Query subscriptions
        $query = Subscription::with('renewals');

        // Filter by Status
        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // Search by Name, Plan or Date
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('plan', 'like', "%{$search}%")
                  ->orWhereDate('start_date', 'like', "%{$search}%")
                  ->orWhereDate('end_date', 'like', "%{$search}%");
            });
        }

        $subscriptions = $query->orderBy('end_date', 'asc')->get();

        return Inertia::render('Subscriptions/SubscriptionIndex', [
            'subscriptions' => $subscriptions,
            'filters' => [
                'status' => $request->status ?? 'All',
                'search' => $request->search ?? '',
            ]
        ]);
    }

    /**
     * Store a newly created subscription.
     */
    public function store(Request $request)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'plan' => 'required|string|max:255',
            'type' => 'required|string|in:Monthly,Quarterly,Half-Yearly,Yearly,Custom',
            'amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'users_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|string|in:Active,Expiring Soon,Expired,Cancelled',
        ]);

        // Dynamically compute the initial status based on end_date
        if ($validated['status'] !== 'Cancelled') {
            $endDate = Carbon::parse($validated['end_date']);
            $daysLeft = Carbon::today()->diffInDays($endDate, false);

            if ($daysLeft <= 0) {
                $validated['status'] = 'Expired';
            } elseif ($daysLeft <= 30) {
                $validated['status'] = 'Expiring Soon';
            } else {
                $validated['status'] = 'Active';
            }
        }

        Subscription::create($validated);

        return back()->with('success', 'Subscription added successfully.');
    }

    /**
     * Update the specified subscription.
     */
    public function update(Request $request, $id)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $subscription = Subscription::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'plan' => 'required|string|max:255',
            'type' => 'required|string|in:Monthly,Quarterly,Half-Yearly,Yearly,Custom',
            'amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'users_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|string|in:Active,Expiring Soon,Expired,Cancelled',
        ]);

        // Dynamically compute status if not cancelled
        if ($validated['status'] !== 'Cancelled') {
            $endDate = Carbon::parse($validated['end_date']);
            $daysLeft = Carbon::today()->diffInDays($endDate, false);

            if ($daysLeft <= 0) {
                $validated['status'] = 'Expired';
            } elseif ($daysLeft <= 30) {
                $validated['status'] = 'Expiring Soon';
            } else {
                $validated['status'] = 'Active';
            }
        }

        $subscription->update($validated);

        return back()->with('success', 'Subscription updated successfully.');
    }

    /**
     * Remove the specified subscription.
     */
    public function destroy($id)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $subscription = Subscription::findOrFail($id);
        $subscription->delete();

        return back()->with('success', 'Subscription deleted successfully.');
    }

    /**
     * Renew an existing subscription, saving the previous state to history.
     */
    public function renew(Request $request, $id)
    {
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $subscription = Subscription::findOrFail($id);

        $validated = $request->validate([
            'plan' => 'required|string|max:255',
            'type' => 'required|string|in:Monthly,Quarterly,Half-Yearly,Yearly,Custom',
            'amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'users_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        // 1. Create a historical log of the CURRENT active subscription details
        SubscriptionRenewal::create([
            'subscription_id' => $subscription->id,
            'plan' => $subscription->plan,
            'type' => $subscription->type,
            'amount' => $subscription->amount,
            'start_date' => $subscription->start_date,
            'end_date' => $subscription->end_date,
            'users_count' => $subscription->users_count,
            'notes' => $subscription->notes,
        ]);

        // 2. Calculate the new status
        $endDate = Carbon::parse($validated['end_date']);
        $daysLeft = Carbon::today()->diffInDays($endDate, false);
        
        $newStatus = 'Active';
        if ($daysLeft <= 0) {
            $newStatus = 'Expired';
        } elseif ($daysLeft <= 30) {
            $newStatus = 'Expiring Soon';
        }

        // 3. Update the main subscription record with the new renewal details
        $subscription->update([
            'plan' => $validated['plan'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'users_count' => $validated['users_count'],
            'notes' => $validated['notes'],
            'status' => $newStatus,
        ]);

        return back()->with('success', 'Subscription renewed successfully.');
    }

    /**
     * Auto update statuses for non-cancelled subscriptions based on days left.
     */
    protected function autoUpdateStatuses()
    {
        $subscriptions = Subscription::where('status', '!=', 'Cancelled')->get();
        
        foreach ($subscriptions as $sub) {
            $daysLeft = $sub->days_left;
            $newStatus = $sub->status;

            if ($daysLeft <= 0) {
                $newStatus = 'Expired';
            } elseif ($daysLeft <= 30) {
                $newStatus = 'Expiring Soon';
            } else {
                $newStatus = 'Active';
            }

            if ($sub->status !== $newStatus) {
                $sub->status = $newStatus;
                $sub->save();
            }
        }
    }
}
