<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $parentId = $request->input('parent_id');
        $user = $request->user();

        // Load root level or subfolder level files
        $query = Document::with('uploader')
            ->where('parent_id', $parentId);

        $documents = $query->orderBy('is_folder', 'desc')
            ->orderBy('name', 'asc')
            ->get()
            ->filter(function ($doc) use ($user) {
                // If there are allowed roles, check if user's role is in the array
                if ($doc->allowed_roles && count($doc->allowed_roles) > 0) {
                    return in_array($user->role, $doc->allowed_roles);
                }
                return true;
            })
            ->values();

        // Breadcrumbs
        $breadcrumbs = [];
        $current = $parentId ? Document::find($parentId) : null;
        while ($current) {
            array_unshift($breadcrumbs, [
                'id' => $current->id,
                'name' => $current->name
            ]);
            $current = $current->parent_id ? Document::find($current->parent_id) : null;
        }

        return Inertia::render('Documents/DocumentIndex', [
            'documents' => $documents,
            'currentFolderId' => $parentId,
            'breadcrumbs' => $breadcrumbs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_folder' => 'required|boolean',
            'parent_id' => 'nullable|exists:documents,id',
            'file' => 'nullable|file|max:20480', // 20MB
            'allowed_roles' => 'nullable|array',
        ]);

        $filePath = null;
        $fileSize = null;
        $fileType = null;

        if ($validated['is_folder'] == false && $request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('company_documents', 'public');
            $fileSize = $file->getSize();
            $fileType = $file->getClientOriginalExtension();
        }

        Document::create([
            'name' => $validated['name'],
            'is_folder' => $validated['is_folder'],
            'parent_id' => $validated['parent_id'] ?? null,
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'file_type' => $fileType,
            'uploader_id' => Auth::id(),
            'allowed_roles' => $validated['allowed_roles'] ?? null,
        ]);

        return back()->with('success', $validated['is_folder'] ? 'Folder created.' : 'File uploaded.');
    }

    public function destroy(Document $document)
    {
        // Restrict deletes to Uploader, Manager, or Admin
        if ($document->uploader_id != Auth::id() && !in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return back()->withErrors(['error' => 'Unauthorized to delete this item.']);
        }

        $document->delete();
        return back()->with('success', 'Document deleted.');
    }
}
