// frontend/src/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import "./LoginPage.css";

interface LoginPageProps {
  isRegistering?: boolean;
}

export function LoginPage({ isRegistering = false }: LoginPageProps) {
  const navigate = useNavigate();

  // — Form state —
  const [username, setUsername]           = useState("");
  const [password, setPassword]           = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [errorText, setErrorText]         = useState<string | null>(null);

  // — Helper: register a new account, returns void or throws an Error —
  async function registerAccount(username: string, password: string) {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 201) {
      return;
    }

    const payload = await res.json().catch(() => ({}));
    if (res.status === 400) {
      throw new Error(payload.message || "Missing username or password");
    }
    if (res.status === 409) {
      throw new Error(payload.message || "Username already taken");
    }
    throw new Error(payload.message || `Unexpected status ${res.status}`);
  }

  // — Helper: log in an existing account, logs token or throws an Error —
  async function loginAccount(username: string, password: string) {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 200) {
      const { token } = await res.json();
      console.log("Received JWT:", token);
      // Optionally store it for later:
      localStorage.setItem("jwt", token);
      return;
    }

    const payload = await res.json().catch(() => ({}));
    if (res.status === 400) {
      throw new Error(payload.message || "Missing username or password");
    }
    if (res.status === 401) {
      throw new Error(payload.message || "Invalid username or password");
    }
    throw new Error(payload.message || `Unexpected status ${res.status}`);
  }

  // — Single submit handler with one if(isRegistering) —
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText(null);

    if (!username.trim() || !password) {
      setErrorText("Username and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        await registerAccount(username.trim(), password);
        console.log("Successfully created account");
        navigate("/login");
      } else {
        await loginAccount(username.trim(), password);
        console.log("Successfully logged in");
        navigate("/");
      }
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
