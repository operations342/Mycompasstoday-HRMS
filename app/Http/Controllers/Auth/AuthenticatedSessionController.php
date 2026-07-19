<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $email = $request->input('email');
        $pwdLength = strlen($request->input('password'));
        
        \Illuminate\Support\Facades\Log::info("Login attempt payload", [
            'email' => $email,
            'password_length' => $pwdLength,
            'ip' => $request->ip()
        ]);

        try {
            $request->authenticate();
            
            \Illuminate\Support\Facades\Log::info("Login attempt successful", [
                'email' => $email
            ]);

            $request->session()->regenerate();
            return redirect()->intended(route('dashboard', absolute: false));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Login attempt failed", [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
