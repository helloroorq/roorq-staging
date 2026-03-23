"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Phone, Mail, Shield } from "lucide-react";
import toast from "react-hot-toast";

type AuthMode = "signin" | "signup";
type LoginMethod = "email" | "phone";

type ApiErrorResponse = {
  error?: string;
};

const readCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  document.cookie = parts.join("; ");
};

const createCsrfToken = () => {
  const webCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [method, setMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [countdown, setCountdown] = useState(0);
  const [csrfToken, setCsrfToken] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");
  const requestedMode = searchParams?.get("mode");
  const redirectPath = redirectParam?.startsWith("/profile") ? "/" : (redirectParam ?? "/");
  const referralParam = searchParams?.get("ref") ?? "";
  const errorParam = searchParams?.get("error");
  const stepParam = searchParams?.get("step");
  const isMobileFormStep = stepParam === "form";
  const supabase = createClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");

  useEffect(() => {
    const existing = readCookie("auth_csrf");
    if (existing) {
      setCsrfToken(existing);
      return;
    }
    const token = createCsrfToken();
    setCookie("auth_csrf", token, 60 * 60);
    setCsrfToken(token);
  }, []);

  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        expired: "Your verification code has expired. Please request a new one.",
        invalid: "Invalid verification code. Please try again.",
        used: "This verification code has already been used.",
        invalid_session: "Your session is invalid. Please sign in again.",
        auth_failed: "Authentication failed. Please try again.",
        network: "Network error. Please check your connection and try again.",
        unauthorized: "Please sign in to continue.",
        rate_limited: "Too many attempts. Please wait before trying again.",
        csrf: "Security check failed. Please refresh and try again.",
        session_expired: "Your session expired due to inactivity. Please sign in again.",
        suspicious: "We detected unusual activity. Please sign in again.",
      };

      const message = errorMessages[errorParam] || `Error: ${errorParam}`;
      toast.error(message);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [errorParam, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (requestedMode === "signin" || requestedMode === "signup") {
      setMode(requestedMode);
      setStep("input");
      setOtp("");
    }
  }, [requestedMode]);

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const buildCallbackParams = () => {
    const callbackParams = new URLSearchParams();
    callbackParams.set("redirect", redirectPath);
    if (referralParam) callbackParams.set("ref", referralParam);
    if (csrfToken) callbackParams.set("csrf", csrfToken);
    return callbackParams;
  };

  const handleGoogleSignIn = async () => {
    if (!csrfToken) {
      toast.error("Security token missing. Please refresh.");
      return;
    }
    setLoading(true);
    try {
      const callbackParams = buildCallbackParams();
      const redirectTo = `${siteUrl}/auth/callback?${callbackParams.toString()}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to sign in with Google"));
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!csrfToken) {
      toast.error("Security token missing. Please refresh.");
      return;
    }

    setLoading(true);
    try {
      if (method === "email") {
        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "email",
            mode,
            email: email.trim().toLowerCase(),
            redirect: redirectPath,
            ref: referralParam || undefined,
            csrf: csrfToken,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        if (!res.ok) {
          throw new Error(data.error || "Failed to send code.");
        }
        setStep("otp");
        setCountdown(60);
        toast.success(`Code sent to ${email}`);
      } else {
        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "phone",
            mode,
            phone,
            redirect: redirectPath,
            ref: referralParam || undefined,
            csrf: csrfToken,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        if (!res.ok) {
          throw new Error(data.error || "Failed to send code.");
        }
        setStep("otp");
        setCountdown(60);
        toast.success(`Code sent to ${formatPhoneNumber(phone)}`);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send code"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtp();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrfToken) {
      toast.error("Security token missing. Please refresh.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          email: method === "email" ? email.trim().toLowerCase() : undefined,
          phone: method === "phone" ? phone : undefined,
          token: otp,
          csrf: csrfToken,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
      if (!res.ok) {
        const retryAfter = res.headers.get("Retry-After");
        if (res.status === 429 && retryAfter) {
          throw new Error(`${data.error || "Too many attempts."} Try again in ${retryAfter}s.`);
        }
        throw new Error(data.error || "Invalid code.");
      }

      toast.success("Success! Redirecting...");
      setTimeout(() => {
        const callbackParams = buildCallbackParams();
        router.replace(`/auth/callback?${callbackParams.toString()}`);
      }, 800);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Invalid code. Please try again."));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    if (!csrfToken) {
      toast.error("Security token missing. Please refresh.");
      return;
    }
    if (!email.trim()) {
      toast.error("Enter your email first.");
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirect: redirectPath,
          csrf: csrfToken,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
      if (!res.ok) {
        const retryAfter = res.headers.get("Retry-After");
        if (res.status === 429 && retryAfter) {
          throw new Error(`${data.error || "Too many requests."} Try again in ${retryAfter}s.`);
        }
        throw new Error(data.error || "Failed to send recovery link.");
      }

      toast.success("Recovery link sent. Check your email.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send recovery link."));
    } finally {
      setRecoveryLoading(false);
    }
  };

  const goToFormStep = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("step", "form");
    router.push(`/auth?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#1b1a16] selection:bg-[#1b1a16] selection:text-white">
      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.75; }
          100% { opacity: 0.4; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(115deg,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(25deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[#dcdcdc]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-[-80px] h-80 w-80 rounded-full bg-[#f0f0f0]/90 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-5 py-10 lg:grid lg:grid-cols-[1.15fr_1fr]">
        <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#1f1f1f] text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] ${
            isMobileFormStep ? "hidden lg:block" : ""
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14)_0%,rgba(0,0,0,0.55)_65%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10 p-8 md:p-10">
            <div className="space-y-6 motion-safe:animate-[fade-up_0.7s_ease-out_both]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2">
                <span className="text-xl font-black tracking-tight">roorq.</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-[var(--font-mono)] uppercase tracking-[0.3em] text-white/70">
                <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1">
                  Roorq Archive
                </span>
                <span>Weekly drop club</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-[var(--font-display)] leading-[0.95] tracking-tight">
                Vintage gear, verified for campus delivery.
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-white/75">
                Curated thrift drops every week. Pay on delivery, pick up on campus, and stay ahead of the queue.
              </p>
              <div className="grid gap-3 text-[11px] uppercase tracking-[0.2em] font-[var(--font-mono)] text-white/70 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  COD first, UPI on delivery
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  Limited units each drop
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  IIT delivery lanes
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  24h campus pickup
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative h-40 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.25)] motion-safe:animate-[float-slow_8s_ease-in-out_infinite] sm:h-52">
                <Image
                  src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80"
                  alt="Roorq vintage model"
                  fill
                  sizes="(min-width: 1024px) 30vw, 80vw"
                  className="object-cover"
                />
              </div>
              <div className="relative h-40 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.28)] sm:h-52">
                <Image
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
                  alt="Vintage rack"
                  fill
                  sizes="(min-width: 1024px) 30vw, 80vw"
                  className="object-cover"
                />
              </div>
              <div className="relative h-44 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-[0_14px_32px_rgba(0,0,0,0.3)] sm:col-span-2 sm:h-52 motion-safe:animate-[shimmer_4.5s_ease-in-out_infinite]">
                <Image
                  src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80"
                  alt="Vintage streetwear"
                  fill
                  sizes="(min-width: 1024px) 50vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-[var(--font-mono)] uppercase tracking-[0.2em] text-white/70">
              <span className="rounded-full border border-white/30 px-3 py-1">Campus verified</span>
              <span className="rounded-full border border-white/30 px-3 py-1">Drop alerts</span>
              <span className="rounded-full border border-white/30 px-3 py-1">COD guarantee</span>
            </div>

            <div className="lg:hidden">
              <button
                type="button"
                onClick={goToFormStep}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-[var(--font-mono)] uppercase tracking-[0.24em] text-[#1b1a16] shadow-[0_16px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_35px_rgba(0,0,0,0.45)]"
              >
                Get started free
              </button>
            </div>
          </div>
        </section>

        <section className={`relative ${isMobileFormStep ? "" : "hidden lg:block"}`}>
          <div className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6 text-[#f5f5f5] shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur md:p-8">
            <div className="mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="text-xs font-[var(--font-mono)] uppercase tracking-[0.18em] text-gray-300 underline decoration-dotted underline-offset-4"
              >
                Back
              </button>
            </div>
            <div className="flex flex-col gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-[var(--font-mono)] uppercase tracking-[0.3em] text-gray-400">
                  Member access
                </p>
                <h2 className="text-3xl sm:text-4xl font-[var(--font-display)] tracking-tight">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-sm text-gray-300">
                  Sign in to claim this week's drop.
                </p>
              </div>
              <div className="flex w-full items-center justify-between rounded-full border border-white/10 bg-[#2a2a2a] p-1 text-[11px] font-[var(--font-mono)] uppercase tracking-[0.22em] sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setStep("input");
                    setOtp("");
                  }}
                  aria-pressed={mode === "signin"}
                  className={`flex-1 rounded-full px-4 py-2 transition ${
                    mode === "signin"
                      ? "bg-white text-[#1b1a16] shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setStep("input");
                    setOtp("");
                  }}
                  aria-pressed={mode === "signup"}
                  className={`flex-1 rounded-full px-4 py-2 transition ${
                    mode === "signup"
                      ? "bg-white text-[#1b1a16] shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Sign up
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {step === "input" ? (
                <>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-[#1b1a16] shadow-[0_12px_24px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(0,0,0,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center justify-center gap-3 text-xs font-[var(--font-mono)] uppercase tracking-[0.22em]">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${mode === "signin" ? "Sign in" : "Sign up"} with Google`}
                    </span>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[11px] font-[var(--font-mono)] uppercase tracking-[0.24em] text-gray-400">
                      <span className="bg-[#1f1f1f] px-3">or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod("email")}
                      className={`rounded-2xl border px-3 py-3 text-xs font-[var(--font-mono)] uppercase tracking-[0.2em] transition ${
                        method === "email"
                          ? "border-white bg-white text-[#1b1a16] shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                          : "border-white/10 bg-[#2a2a2a] text-gray-300 hover:border-white"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("phone")}
                      className={`rounded-2xl border px-3 py-3 text-xs font-[var(--font-mono)] uppercase tracking-[0.2em] transition ${
                        method === "phone"
                          ? "border-white bg-white text-[#1b1a16] shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                          : "border-white/10 bg-[#2a2a2a] text-gray-300 hover:border-white"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </span>
                    </button>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-4">
                    {method === "email" ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-[var(--font-mono)] uppercase tracking-[0.2em] text-gray-300">
                          Email address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-sm text-white placeholder-gray-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/10"
                          disabled={loading}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-[var(--font-mono)] uppercase tracking-[0.2em] text-gray-300">
                          Phone number
                        </label>
                        <div className="flex gap-2">
                          <div className="flex items-center rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-xs font-[var(--font-mono)] uppercase text-gray-300">
                            +91
                          </div>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                            placeholder="999-999-9999"
                            maxLength={12}
                            className="flex-1 rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-sm text-white placeholder-gray-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/10"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !csrfToken}
                      className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-[var(--font-mono)] uppercase tracking-[0.24em] text-[#1b1a16] shadow-[0_16px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_35px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                    </button>

                    {method === "email" && (
                      <button
                        type="button"
                        onClick={handleRecovery}
                        disabled={recoveryLoading || loading}
                        className="w-full text-xs font-[var(--font-mono)] uppercase tracking-[0.18em] text-gray-300 underline decoration-dotted underline-offset-4 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        {recoveryLoading ? "Sending recovery link..." : "Need help? Send recovery link"}
                      </button>
                    )}
                  </form>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-[11px] font-[var(--font-mono)] uppercase tracking-[0.24em] text-gray-400">
                      Verification code
                    </p>
                    <h3 className="text-2xl font-[var(--font-display)] tracking-tight">
                      Enter your 6-digit code
                    </h3>
                    <p className="text-sm text-gray-300">
                      Sent to {method === "email" ? email : formatPhoneNumber(phone)}
                    </p>
                    <button
                      onClick={() => {
                        setStep("input");
                        setOtp("");
                      }}
                      className="text-xs font-[var(--font-mono)] uppercase tracking-[0.18em] text-gray-300 underline decoration-dotted underline-offset-4"
                    >
                      Change {method}
                    </button>
                  </div>

                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-4 text-center text-2xl tracking-[0.4em] text-white placeholder-gray-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/10"
                      disabled={loading}
                      autoFocus
                    />

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6 || !csrfToken}
                      className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-[var(--font-mono)] uppercase tracking-[0.24em] text-[#1b1a16] shadow-[0_16px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_35px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and enter"}
                    </button>

                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={countdown > 0 || loading}
                      className="w-full text-xs font-[var(--font-mono)] uppercase tracking-[0.18em] text-gray-300 underline decoration-dotted underline-offset-4 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                    </button>
                  </form>
                </>
              )}

              <div className="rounded-2xl border border-white/10 bg-[#262626] px-4 py-3 text-xs text-gray-300">
                <div className="flex items-center gap-2 font-[var(--font-mono)] uppercase tracking-[0.18em]">
                  <Shield className="h-4 w-4 text-gray-200" />
                  Secure login, COD protected
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  We never store your passwords. You can always choose pay on delivery at checkout.
                </p>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed uppercase tracking-[0.16em]">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
