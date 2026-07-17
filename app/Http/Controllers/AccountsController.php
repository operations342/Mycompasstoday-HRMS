<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Expense;
use Illuminate\Support\Facades\Auth;

class AccountsController extends Controller
{
    public function index()
    {
        $expenses = Expense::orderBy('date', 'desc')->get();

        // Totals
        $totalExpense = Expense::where('type', 'Expense')->sum('amount');
        $totalInvoice = Expense::where('type', 'Invoice')->sum('amount');
        $totalSalary = Expense::where('type', 'Salary')->sum('amount');
        $totalPayments = Expense::where('type', 'Vendor Payment')->sum('amount');

        return Inertia::render('HRAccounts/AccountsArea', [
            'expenses' => $expenses,
            'summary' => [
                'totalExpense' => $totalExpense,
                'totalInvoice' => $totalInvoice,
                'totalSalary' => $totalSalary,
                'totalPayments' => $totalPayments,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:Expense,Invoice,Salary,Vendor Payment',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'category' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        Expense::create(array_merge($validated, [
            'status' => 'Pending',
        ]));

        return redirect()->route('accounts.index')->with('success', 'Accounts record created.');
    }

    public function approve(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Approved,Paid,Rejected'
        ]);

        $expense->update([
            'status' => $validated['status']
        ]);

        return back()->with('success', "Record status updated to {$validated['status']}.");
    }
}
