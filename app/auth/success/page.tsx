"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AuthSuccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/" : "/login");
  }, [user, loading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />

        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {loading ? "Completing Google login" : "Redirecting"}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading
            ? "Please wait while we verify your account..."
            : user
              ? "Taking you to your dashboard..."
              : "Login failed. Taking you back to the login page..."}
        </p>
      </div>
    </main>
  );
}
