import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { useAuth } from "./hooks/use-auth";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer from "./components/ToastContainer";
import CommandPalette from "./features/search/CommandPalette";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import Lists from "./pages/Lists";
import Review from "./pages/Review";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface-950">
      <CommandPalette />
      <ToastContainer />

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-surface-800 p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">kingfisher</h1>
          {user && (
            <p className="mt-1 text-sm text-surface-500">{user.username}</p>
          )}
        </div>
        <nav className="flex-1 space-y-2">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/problems">Problems</NavLink>
          <NavLink to="/lists">Lists</NavLink>
          <NavLink to="/review">Review</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          {user?.is_admin && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="space-y-2 pt-4 border-t border-surface-800">
          <NavLink to="/settings">Settings</NavLink>
          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-surface-400 hover:bg-surface-800 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-surface-800 bg-surface-950 px-2 py-2 md:hidden">
        <MobileNavLink to="/" label="Home" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        <MobileNavLink to="/problems" label="Problems" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <MobileNavLink to="/review" label="Review" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <MobileNavLink to="/analytics" label="Analytics" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        <button onClick={logout} className="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span className="text-[10px]">Sign out</span>
        </button>
      </nav>

      {/* Main */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="block rounded-lg px-3 py-2 text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
      {children}
    </Link>
  );
}

function MobileNavLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-500 hover:text-white transition-colors">
      {icon}
      <span className="text-[10px]">{label}</span>
    </Link>
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
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
