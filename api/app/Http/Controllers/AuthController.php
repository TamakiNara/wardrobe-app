<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = DB::transaction(function () use ($request) {
            return User::create([
                'name' => $request->validated()['name'],
                'email' => $request->validated()['email'],
                'password' => Hash::make($request->validated()['password']),
            ]);
        });

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'registered',
            'user' => $user,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $cred = $request->validated();

        if (! Auth::guard('web')->attempt($cred)) {
            return response()->json(['message' => 'invalid credentials'], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'logged_in',
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'logged_out',
        ]);
    }
}
