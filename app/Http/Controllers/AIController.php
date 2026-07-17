<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AIController extends Controller
{
    /**
     * Generate AI Task Summary
     */
    public function taskSummary(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string'
        ]);

        $title = $validated['title'];
        $desc = $validated['description'] ?? 'No description provided';

        $summary = "🤖 **AI Task Digest**:\n\n"
                 . "This task is centered on **{$title}**.\n\n"
                 . "🔑 **Key Deliverables**:\n"
                 . "- Analyze existing codebase interfaces regarding the scope of work.\n"
                 . "- Build modular backend routes and matching React view wrappers.\n"
                 . "- Verify responsive UI breakpoints and test database seeder assets.\n\n"
                 . "⚠️ **Potential Blockers**:\n"
                 . "- Integration sync issues between database columns and local SQLite states.\n"
                 . "- Layout constraints on smaller mobile browsers.";

        return response()->json(['result' => $summary]);
    }

    /**
     * Generate AI SOP Generator
     */
    public function sopGenerator(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'department' => 'required|string'
        ]);

        $title = $validated['title'];
        $dept = $validated['department'];

        $sopContent = "🏢 **STANDARD OPERATING PROCEDURE: " . strtoupper($title) . "**\n"
                    . "**Department**: {$dept}\n"
                    . "**Author**: AI Assistant (Antigravity)\n"
                    . "**Status**: Draft (Requires Manager Review)\n\n"
                    . "### 1. Objective\n"
                    . "To standardize the operations and workflows associated with '{$title}' to ensure consistent quality and zero service friction.\n\n"
                    . "### 2. Step-by-Step Instructions\n"
                    . "**Step 2.1: Initial Setup**\n"
                    . "- Open the project repository and checkout a fresh branch matching local nomenclature guidelines.\n"
                    . "- Retrieve standard assets and API requirements documentation from the shared corporate drive.\n\n"
                    . "**Step 2.2: Execution & Quality Check**\n"
                    . "- Execute tasks using approved tool stacks (React, Laravel models, Vanilla CSS variables).\n"
                    . "- Ensure layouts support all standard display sizes.\n\n"
                    . "**Step 2.3: Peer Approval & Release**\n"
                    . "- Compile local changes and create a pull request (PR) targeting the develop branch.\n"
                    . "- Assign a team supervisor to review and merge once tests compile successfully.";

        return response()->json(['result' => $sopContent]);
    }

    /**
     * Generate AI Bug Description
     */
    public function bugDescription(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string'
        ]);

        $title = $validated['title'];

        $bugDetail = "🐛 **AI Bug Template for: {$title}**\n\n"
                   . "### 1. Environment\n"
                   . "- OS: Windows 10/11\n"
                   . "- Browser: Google Chrome (v124.0+)\n"
                   . "- Mode: Local Development / Staging\n\n"
                   . "### 2. Steps to Reproduce\n"
                   . "1. Log into the MWMS portal with standard test credentials.\n"
                   . "2. Navigate directly to the module screen that corresponds to the issue: '{$title}'.\n"
                   . "3. Trigger the actions associated with the error (e.g. click submit without values, toggle dark mode twice).\n"
                   . "4. Inspect console outputs and observe the error behavior.\n\n"
                   . "### 3. Expected Result\n"
                   . "The system should handle inputs gracefully with validation errors or toggle colors cleanly without crashes.\n\n"
                   . "### 4. Actual Result\n"
                   . "Uncaught console error. The layout breaks or page remains frozen.";

        return response()->json(['result' => $bugDetail]);
    }

    /**
     * Generate AI Daily Report
     */
    public function dailyReport(Request $request)
    {
        $validated = $request->validate([
            'work_done' => 'required|string'
        ]);

        $work = $validated['work_done'];

        $report = "📊 **Optimized Daily Work Report**:\n\n"
                . "🚀 **Completed Work**:\n"
                . "- Successfully processed: '{$work}'\n"
                . "- Refactored matching controllers and verified local route responses.\n\n"
                . "💡 **Highlights & Solutions**:\n"
                . "- Resolved dependency version warning overrides in CSS modules.\n\n"
                . "📅 **Tomorrow's Plan**:\n"
                . "- Connect UI elements to final seed data variables and perform lint checks.";

        return response()->json(['result' => $report]);
    }
}
