"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ListTodo, History, LogOut, User } from "lucide-react";
import { clearAuthToken, getLoggedInUser } from "../utils/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    setUser(getLoggedInUser());
  }, [pathname]);

  const handleLogout = () => {
    clearAuthToken();
    router.push("/auth/login");
  };

  // Do not display navbar on login/signup pages
  if (pathname?.startsWith("/auth")) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group text-decoration-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="font-black text-white text-xl">T</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Taskit
          </span>
        </Link>

        {/* Links */}
        {user && (
          <div className="flex items-center gap-1 md:gap-2">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-decoration-none ${
                pathname === "/"
                  ? "bg-violet-600/10 text-violet-600 border border-violet-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              href="/chores"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-decoration-none ${
                pathname === "/chores"
                  ? "bg-violet-600/10 text-violet-600 border border-violet-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <ListTodo size={16} />
              <span className="hidden sm:inline">Chores</span>
            </Link>

            <Link
              href="/history"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-decoration-none ${
                pathname === "/history"
                  ? "bg-violet-600/10 text-violet-600 border border-violet-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <History size={16} />
              <span className="hidden sm:inline">History</span>
            </Link>
          </div>
        )}

        {/* User Info / Auth state */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <User size={14} className="text-violet-600" />
                <span className="text-xs font-semibold text-slate-600 capitalize">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-200 cursor-pointer"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/35 transition-all duration-200 text-decoration-none"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
