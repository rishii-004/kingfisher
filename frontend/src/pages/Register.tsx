import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";

export default function Register() {
  const { isAuthenticated, register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [matchError, setMatchError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMatchError("");

    if (password !== confirm) {
      setMatchError("Passwords do not match");
      return;
    }

    register.mutate({ username, email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950">
      <div className="w-full max-w-sm rounded-xl bg-surface-900 p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-white">Create account</h1>

        {(register.error || matchError) && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {matchError || (register.error as Error).message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-surface-400" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
              placeholder="johndoe"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-surface-400" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-surface-400" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-surface-400" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={register.isPending}
            className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {register.isPending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-surface-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
