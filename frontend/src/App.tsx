import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { useAuth } from "./hooks/use-auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import Lists from "./pages/Lists";
import Review from "./pages/Review";

function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface-950">
      <aside className="flex w-64 flex-col border-r border-surface-800 p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">kingfisher</h1>
          {user && (
            <p className="mt-1 text-sm text-surface-500">{user.username}</p>
          )}
        </div>
        <nav className="flex-1 space-y-2">
          <Link to="/" className="block rounded-lg px-3 py-2 text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">Dashboard</Link>
          <Link to="/problems" className="block rounded-lg px-3 py-2 text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">Problems</Link>
          <Link to="/lists" className="block rounded-lg px-3 py-2 text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">Lists</Link>
          <Link to="/review" className="block rounded-lg px-3 py-2 text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">Review</Link>
        </nav>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-2 text-left text-surface-400 hover:bg-surface-800 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="problems" element={<Problems />} />
              <Route path="lists" element={<Lists />} />
              <Route path="review" element={<Review />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
