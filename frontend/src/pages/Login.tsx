import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/use-auth";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass-card-accent p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black text-surface-900 tracking-tight">sheets</h1>
            <p className="mt-1.5 text-sm text-surface-400">Sign in to your account</p>
          </div>

          {login.error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400"
            >
              {(login.error as Error).message}
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glass w-full px-4 py-2.5 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glass w-full px-4 py-2.5 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={login.isPending}
              className="btn-primary w-full py-2.5"
            >
              {login.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-surface-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-rose-600 hover:text-rose-500 font-medium transition-colors">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
