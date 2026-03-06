<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Models\User;
use Tests\TestCase;

class AuthEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_csrf_cookie_sets_session_and_xsrf_cookie(): void
    {
        $res = $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        $res->assertNoContent();
        $res->assertCookie('XSRF-TOKEN');
        $res->assertCookie(config('session.cookie')); // laravel-session
    }

    public function test_register_creates_user_and_logs_in(): void
    {
        // CSRF/セッションを取得
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        // Laravelのテストクライアントはセッションを保持してくれるので
        // トークンは session('_token') で取れる
        $token = session()->token();

        $res = $this->postJson('/api/register', [
            'name' => 'test',
            'email' => 'p72fkzi1c_fo09hhkdk96@hotmail.com',
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'p72fkzi1c_fo09hhkdk96@hotmail.com']);

        // ログインできていること（webガード）
        $this->assertAuthenticated('web');
    }

    public function test_me_requires_auth(): void
    {
        $res = $this->getJson('/api/me', ['Accept' => 'application/json']);
        $res->assertStatus(401);
    }

    public function test_login_then_me_returns_user(): void
    {
        $user = User::factory()->create([
            'email' => 'p72fkzi1c_fo09hhkdk96@hotmail.com',
            'password' => bcrypt('password123'),
        ]);

        $this->get('/csrf-cookie', ['Accept' => 'application/json']);
        $token = session()->token();

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $login->assertOk();
        $this->assertAuthenticated('web');

        $me = $this->getJson('/api/me', ['Accept' => 'application/json']);
        $me->assertOk()->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
    }
}
