<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function issueCsrfToken(): string
    {
        // 先に CSRF Cookie を発行してセッションを開始する
        $this->get('/csrf-cookie', ['Accept' => 'application/json']);

        // 現在のセッションに紐づく CSRF トークンを取得
        return session()->token();
    }

    /*
    |--------------------------------------------------------------------------
    | /csrf-cookie
    |--------------------------------------------------------------------------
    */

    /**
     * CSRF用エンドポイントが必要なCookieを返すことを確認する。
     *
     * このアプリでは POST 系APIの前に /csrf-cookie を呼ぶ前提なので、
     * 最低限 XSRF-TOKEN とセッションCookie が返ることを保証する。
     */
    public function test_csrf_cookie_sets_required_cookies(): void
    {
        $response = $this->get('/csrf-cookie', [
            'Accept' => 'application/json',
        ]);

        $response->assertNoContent();

        // JavaScript側やBFF側で使う CSRF Cookie
        $response->assertCookie('XSRF-TOKEN');

        // Laravelセッション用 Cookie
        $response->assertCookie(config('session.cookie'));
    }

    /*
    |--------------------------------------------------------------------------
    | /api/register
    |--------------------------------------------------------------------------
    */

    /**
     * 正常な登録リクエストでユーザーが作成され、
     * かつログイン状態になることを確認する。
     */
    public function test_register_creates_user_and_logs_in(): void
    {
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/register', [
            'name' => 'Test',
            'email' => 'sample.user@gmail.com',
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'registered')
            ->assertJsonPath('user.name', 'Test')
            ->assertJsonPath('user.email', 'sample.user@gmail.com');

        // DBにユーザーが作成されていることを確認
        $this->assertDatabaseHas('users', [
            'name' => 'Test',
            'email' => 'sample.user@gmail.com',
        ]);

        $userId = User::query()
            ->where('email', 'sample.user@gmail.com')
            ->value('id');

        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $userId,
            'name' => '仕事',
            'sort_order' => 1,
            'is_active' => true,
            'is_preset' => true,
        ]);
        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $userId,
            'name' => '休日',
            'sort_order' => 2,
            'is_active' => true,
            'is_preset' => true,
        ]);
        $this->assertDatabaseHas('user_tpos', [
            'user_id' => $userId,
            'name' => 'フォーマル',
            'sort_order' => 3,
            'is_active' => true,
            'is_preset' => true,
        ]);

        // 登録後にそのままログイン状態になる設計を保証
        $this->assertAuthenticated('web');
    }

    /**
     * 既に存在するメールアドレスでは登録できないことを確認する。
     */
    public function test_register_returns_validation_error_when_email_is_duplicated(): void
    {
        User::factory()->create([
            'email' => 'sample.user@gmail.com',
        ]);

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/register', [
            'name' => 'Test',
            'email' => 'sample.user@gmail.com',
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * パスワードが短すぎる場合は登録できないことを確認する。
     */
    public function test_register_returns_422_when_password_is_too_short(): void
    {
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/register', [
            'name' => 'Test',
            'email' => 'sample.user@gmail.com',
            'password' => 'short', // 短いパスワード
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * 不正なメールアドレス形式では登録できないことを確認する。
     */
    public function test_register_returns_422_when_email_is_invalid(): void
    {
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/register', [
            'name' => 'Test',
            'email' => 'not-an-email',
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /*
    |--------------------------------------------------------------------------
    | /api/login
    |--------------------------------------------------------------------------
    */

    /**
     * 正しいメールアドレス / パスワードでログインできることを確認する。
     */
    public function test_login_succeeds_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'sample.user@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'logged_in');

        $this->assertAuthenticated('web');
    }

    /**
     * seed 用の example.com アカウントでもログインできることを確認する。
     */
    public function test_login_accepts_example_com_address_used_by_seed_users(): void
    {
        $user = User::factory()->create([
            'email' => 'standard-user@example.com',
            'password' => bcrypt('password123'),
        ]);

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'logged_in');

        $this->assertAuthenticated('web');
    }

    /**
     * パスワードが間違っている場合はログインできないことを確認する。
     */
    public function test_login_returns_422_with_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'sample.user@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password', // 間違ったパスワード
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'invalid credentials');
    }

    /*
    |--------------------------------------------------------------------------
    | /api/me
    |--------------------------------------------------------------------------
    */

    /**
     * 認証済み状態で /api/me を叩くと現在のユーザーが返ることを確認する。
     */
    public function test_me_returns_current_user_when_authenticated(): void
    {
        $user = User::factory()->create([
            'email' => 'sample.user@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/me', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk()
            ->assertJson([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
    }

    /**
     * 未認証状態で /api/me を叩くと 401 になることを確認する。
     *
     * 認証漏れが起きていないことを保証するテスト。
     */
    public function test_me_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/me', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(401);
    }

    /*
    |--------------------------------------------------------------------------
    | /api/logout
    |--------------------------------------------------------------------------
    */

    /**
     * ログアウト後に未認証状態へ戻ることを確認する。
     */
    public function test_logout_invalidates_session(): void
    {
        $user = User::factory()->create([
            'email' => 'sample.user@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($user, 'web');

        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/logout', [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'logged_out');

        $this->assertGuest('web');
    }

    /**
     * ログアウト時に CSRF トークンが再生成されることを確認する。
     *
     * フロント側ではこの更新に追従できないと、再ログイン時に
     * `CSRF token mismatch.` が起きうる。
     */
    public function test_logout_regenerates_csrf_token(): void
    {
        $user = User::factory()->create([
            'email' => 'sample.user@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($user, 'web');

        $beforeLogoutToken = $this->issueCsrfToken();

        $this->postJson('/api/logout', [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $beforeLogoutToken,
        ])->assertOk();

        $afterLogoutToken = session()->token();

        $this->assertNotSame($beforeLogoutToken, $afterLogoutToken);
    }

    /**
     * ログアウト後でも、新しい CSRF トークンを取得し直せば
     * 再ログインできることを確認する。
     */
    public function test_login_succeeds_after_logout_when_csrf_token_is_refreshed(): void
    {
        $user = User::factory()->create([
            'email' => 'sample.user@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($user, 'web');

        $staleToken = $this->issueCsrfToken();

        $this->postJson('/api/logout', [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $staleToken,
        ])->assertOk();

        $freshToken = $this->issueCsrfToken();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $freshToken,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'logged_in');

        $this->assertAuthenticated('web');
    }

    /**
     * 未認証状態でも logout は安全に成功扱いになることを確認する。
     */
    public function test_logout_returns_200_when_unauthenticated(): void
    {
        $token = $this->issueCsrfToken();

        $response = $this->postJson('/api/logout', [], [
            'Accept' => 'application/json',
            'X-CSRF-TOKEN' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'logged_out');
    }
}
