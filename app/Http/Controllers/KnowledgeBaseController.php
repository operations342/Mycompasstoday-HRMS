<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\KnowledgeBaseArticle;
use App\Models\Sop;
use Illuminate\Support\Facades\Auth;

class KnowledgeBaseController extends Controller
{
    /**
     * View Knowledge Base index and articles.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $category = $request->input('category');

        $query = KnowledgeBaseArticle::with(['author', 'approver']);

        // Search in title, description, steps, solutions
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('steps', 'like', "%{$search}%")
                  ->orWhere('solution', 'like', "%{$search}%")
                  ->orWhere('challenges_faced', 'like', "%{$search}%");
            });
        }

        if ($category && $category != 'All') {
            $query->where('category', $category);
        }

        // Standard employees see Approved articles. Admins/Managers see all (including pending review).
        if (!in_array($request->user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            $query->where('approval_status', 'Approved');
        }

        $articles = $query->orderBy('updated_at', 'desc')->get();

        return Inertia::render('KnowledgeBase/KnowledgeIndex', [
            'articles' => $articles,
            'filters' => $request->only(['search', 'category'])
        ]);
    }

    /**
     * Create Knowledge Article manually.
     */
    public function storeArticle(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'steps' => 'required|string',
            'challenges_faced' => 'nullable|string',
            'solution' => 'nullable|string',
            'category' => 'required|string|in:Development,Design,Research,HR,Accounts,Marketing,Back Office',
        ]);

        $article = KnowledgeBaseArticle::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'steps' => $validated['steps'],
            'challenges_faced' => $validated['challenges_faced'] ?? null,
            'solution' => $validated['solution'] ?? null,
            'category' => $validated['category'],
            'author_id' => Auth::id(),
            'approval_status' => in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager']) ? 'Approved' : 'Pending',
            'version' => 1
        ]);

        return redirect()->route('knowledge.index')->with('success', 'Article created successfully.');
    }

    /**
     * Approve or Reject Knowledge Article.
     */
    public function approveArticle(Request $request, KnowledgeBaseArticle $article)
    {
        $validated = $request->validate([
            'approval_status' => 'required|string|in:Approved,Rejected'
        ]);

        $article->approval_status = $validated['approval_status'];
        $article->approved_by = Auth::id();
        $article->save();

        return back()->with('success', "Article status updated to {$validated['approval_status']}.");
    }

    /**
     * Display SOP Index.
     */
    public function sopIndex(Request $request)
    {
        $dept = $request->input('department');

        $query = Sop::with(['author', 'approver']);

        if ($dept && $dept != 'All') {
            $query->where('department', $dept);
        }

        if (!in_array($request->user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            $query->where('approval_status', 'Approved');
        }

        $sops = $query->orderBy('title', 'asc')->get();

        return Inertia::render('KnowledgeBase/SopIndex', [
            'sops' => $sops,
            'filters' => $request->only(['department'])
        ]);
    }

    /**
     * Store a new SOP.
     */
    public function storeSop(Request $request)
    {
        $validated = $request->validate([
            'department' => 'required|string',
            'title' => 'required|string|max:255',
            'instructions' => 'required|string',
        ]);

        $sop = Sop::create([
            'department' => $validated['department'],
            'title' => $validated['title'],
            'instructions' => $validated['instructions'],
            'author_id' => Auth::id(),
            'approval_status' => in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager']) ? 'Approved' : 'Pending',
            'version' => 1
        ]);

        return redirect()->route('sop.index')->with('success', 'SOP created successfully.');
    }

    /**
     * Approve SOP.
     */
    public function approveSop(Request $request, Sop $sop)
    {
        $validated = $request->validate([
            'approval_status' => 'required|string|in:Approved,Rejected'
        ]);

        $sop->approval_status = $validated['approval_status'];
        $sop->approved_by = Auth::id();
        $sop->save();

        return back()->with('success', "SOP status updated to {$validated['approval_status']}.");
    }
}
