"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Chrome, Lock, Mail } from "lucide-react";

export default function Example() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [remember, setRemember] = useState(true);

  return (
    <div className="flex min-h-[700px] w-full">
      <div className="relative hidden w-full overflow-hidden md:inline-block">
        <img
          className="h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80"
          alt="Karma credits rewards"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/30 bg-black/35 p-6 text-white backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Karma rewards
          </p>
          <h3 className="mt-2 text-3xl font-semibold leading-tight">
            Login today and unlock free karma credits.
          </h3>
          <p className="mt-3 text-sm text-white/85">
            Sign in to claim your welcome bonus and save instantly on your next order.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center">
        <form className="flex w-80 flex-col items-center justify-center md:w-96">
          <div className="mb-6 flex w-full items-center justify-end">
            <div className="inline-flex rounded-2xl border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-2xl font-medium text-gray-900 transition",
                  mode === "signin" && "bg-black text-white"
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-2xl font-medium text-gray-900 transition",
                  mode === "signup" && "bg-black text-white"
                )}
              >
                Sign up
              </button>
            </div>
          </div>

          <h2 className="w-full text-4xl font-medium text-gray-900">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-3 w-full text-sm text-gray-500/90">
            {mode === "signin"
              ? "Sign in with Google or a one-time code."
              : "Sign up with Google or a one-time code."}
          </p>

          <button
            type="button"
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-500/10"
          >
            <Chrome className="h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-900">Continue with Google</span>
          </button>

          <div className="my-5 flex w-full items-center gap-4">
            <div className="h-px w-full bg-gray-300/90" />
            <p className="w-full text-nowrap text-sm text-gray-500/90">or sign in with email</p>
            <div className="h-px w-full bg-gray-300/90" />
          </div>

          <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6">
            <Mail className="h-4 w-4 text-gray-500" />
            <input
              type="email"
              placeholder="Email id"
              className="h-full w-full bg-transparent text-sm text-gray-500/80 placeholder-gray-500/80 outline-none"
              required
            />
          </div>

          <div className="mt-6 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6">
            <Lock className="h-4 w-4 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              className="h-full w-full bg-transparent text-sm text-gray-500/80 placeholder-gray-500/80 outline-none"
              required
            />
          </div>

          <div className="mt-8 flex w-full items-center justify-between text-gray-500/80">
            <div className="flex items-center gap-2">
              <input
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5"
                type="checkbox"
                id="checkbox"
              />
              <label className="text-sm" htmlFor="checkbox">
                Remember me
              </label>
            </div>
            <Link className="text-sm underline" href="/auth">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-8 h-11 w-full rounded-full bg-indigo-500 text-white transition-opacity hover:opacity-90"
          >
            {mode === "signin" ? "Login" : "Create account"}
          </button>
          <p className="mt-4 text-sm text-gray-500/90">
            {mode === "signin" ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-indigo-400 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
