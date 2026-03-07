"use client";

import { useState } from "react";
import { getMe, login, logout, register } from "@/lib/api/auth";

type LogEntry = {
  type: "success" | "error";
  message: string;
};

export default function AuthTestPage() {
  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("sample.user@gmail.com");
  const [password, setPassword] = useState("password123");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  function pushLog(entry: LogEntry) {
    setLogs((prev) => [entry, ...prev]);
  }

  async function handleRegister() {
    setLoading("register");
    try {
      const result = await register({ name, email, password });
      pushLog({
        type: "success",
        message: `register success: ${JSON.stringify(result)}`,
      });
    } catch (error) {
      pushLog({
        type: "error",
        message: `register failed: ${String(error)}`,
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleLogin() {
    setLoading("login");
    try {
      const result = await login({ email, password });
      pushLog({
        type: "success",
        message: `login success: ${JSON.stringify(result)}`,
      });
    } catch (error) {
      pushLog({
        type: "error",
        message: `login failed: ${String(error)}`,
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleMe() {
    setLoading("me");
    try {
      const result = await getMe();
      pushLog({
        type: "success",
        message: `me success: ${JSON.stringify(result)}`,
      });
    } catch (error) {
      pushLog({
        type: "error",
        message: `me failed: ${String(error)}`,
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleLogout() {
    setLoading("logout");
    try {
      const result = await logout();
      pushLog({
        type: "success",
        message: `logout success: ${JSON.stringify(result)}`,
      });
    } catch (error) {
      pushLog({
        type: "error",
        message: `logout failed: ${String(error)}`,
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <main style={{ padding: "24px", maxWidth: "720px", margin: "0 auto" }}>
      <h1>Auth Test</h1>

      <div style={{ display: "grid", gap: "12px", marginTop: "24px" }}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </label>

        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
        <button onClick={handleRegister} disabled={loading !== null}>
          {loading === "register" ? "Registering..." : "Register"}
        </button>

        <button onClick={handleLogin} disabled={loading !== null}>
          {loading === "login" ? "Logging in..." : "Login"}
        </button>

        <button onClick={handleMe} disabled={loading !== null}>
          {loading === "me" ? "Loading..." : "Get Me"}
        </button>

        <button onClick={handleLogout} disabled={loading !== null}>
          {loading === "logout" ? "Logging out..." : "Logout"}
        </button>
      </div>

      <section style={{ marginTop: "32px" }}>
        <h2>Logs</h2>
        <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
          {logs.length === 0 ? (
            <p>No logs yet.</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  background: log.type === "success" ? "#f6fff6" : "#fff6f6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {log.message}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
