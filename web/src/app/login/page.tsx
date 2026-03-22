"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function mapLoginErrorMessage(message?: string | null): string {
  if (!message) {
    return "通信に失敗しました。時間をおいて再度お試しください。";
  }

  if (message === "invalid credentials") {
    return "メールアドレスまたはパスワードが正しくありません。";
  }

  if (message === "CSRF token mismatch.") {
    return "通信に失敗しました。時間をおいて再度お試しください。";
  }

  if (message.includes("valid email address")) {
    return "メールアドレスの形式が正しくありません。";
  }

  return "通信に失敗しました。時間をおいて再度お試しください。";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("入力されていない項目があります。内容をご確認ください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(mapLoginErrorMessage(data?.message ?? data?.error));
        return;
      }

      router.push("/");
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md border border-gray-200">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          ログイン
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              placeholder="example@example.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              placeholder="パスワードを入力"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          アカウントがない場合は
          <Link href="/register" className="ml-1 text-blue-600 hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}
