// frontend/src/LoginPage.tsx
import React, { useState } from "react";
import { Link } from "react-router";
import "./LoginPage.css";

interface LoginPageProps {
  /** If true, show the registration form instead of login */
  isRegistering?: boolean;
  /** Called with the JWT on successful login or registration */
  onAuthSuccess: (token: string) => void;
}

export function LoginPage({
  isRegistering = false,
  onAuthSuccess,
}: LoginPageProps) {
  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Hit either /auth/register or /auth/login, return the token on success
  async function callAuthEndpoint(
    endpoint: "/auth/register" | "/auth/login"
  ): Promise<string> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const payload = await res.json().catch(() => ({}));

    if (endpoint === "/auth/register") {
      if (res.status === 201) {
        return payload.token;
      }
      if (res.status === 400) throw new Error(payload.message || "Missing username or password");
      if (res.status === 409) throw new Error(payload.message || "Username already taken");
    } else {
      if (res.status === 200) {
        return payload.token;
      }
      if (res.status === 400) throw new Error(payload.message || "Missing username or password");
      if (res.status === 401) throw new Error(payload.message || "Invalid username or password");
    }

    throw new Error(payload.message || `Unexpected status ${res.status}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText(null);

    if (!username.trim() || !password) {
      setErrorText("Username and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const token = await callAuthEndpoint(endpoint);
      console.log(
        isRegistering
          ? "Successfully registered, token:"
          : "Successfully logged in, token:",
        token
      );
      onAuthSuccess(token);
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorText(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <h2>{isRegistering ? "Register a new account" : "Login"}</h2>
      <form className="LoginPage-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </label>
        <button type="submit" disabled={isLoading}>
          {isRegistering ? "Register" : "Login"}
        </button>
        {isLoading && <p>Working…</p>}
        {errorText && (
          <p role="alert" aria-live="assertive" style={{ color: "red" }}>
            {errorText}
          </p>
        )}
      </form>

      {!isRegistering && (
        <p style={{ marginTop: "1em" }}>
          Don’t have an account? <Link to="/register">Register here</Link>
        </p>
      )}
    </>
  );
}
