"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { SignInPage, type Testimonial } from "@/components/ui/sign-in";

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

const defaultTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful.",
  },
];

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [csrfToken, setCsrfToken] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");
  const requestedMode = searchParams?.get("mode");
  const redirectPath = redirectParam?.startsWith("/profile") ? "/" : (redirectParam ?? "/");
  const referralParam = searchParams?.get("ref") ?? "";
  const errorParam = searchParams?.get("error");

  const supabase = createClient();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");

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
    if (requestedMode === "signup") {
      setAuthMode("signup");
    }
    if (requestedMode === "signin") {
      setAuthMode("signin");
    }
  }, [requestedMode]);

  useEffect(() => {
    if (!errorParam) return;
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
  }, [errorParam, router]);

  const buildCallbackParams = () => {
    const callbackParams = new URLSearchParams();
    callbackParams.set("redirect", redirectPath);
    if (referralParam) callbackParams.set("ref", referralParam);
    if (csrfToken) callbackParams.set("csrf", csrfToken);
    return callbackParams;
  };

  const redirectAfterSession = () => {
    const callbackParams = buildCallbackParams();
    router.replace(`/auth/callback?${callbackParams.toString()}`);
  };

  const handleGoogleSignIn = async () => {
    if (!csrfToken) {
      toast.error("Security token missing. Please refresh.");
      return;
    }
    setGoogleLoading(true);
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
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!email || !password) {
      toast.error("Enter email and password.");
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitLoading(true);
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Signed in. Redirecting…");
        redirectAfterSession();
        return;
      }

      const callbackParams = buildCallbackParams();
      const emailRedirectTo = `${siteUrl}/auth/callback?${callbackParams.toString()}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Account ready. Redirecting…");
        redirectAfterSession();
        return;
      }

      toast.success("Check your email to confirm your account, then sign in.");
      setAuthMode("signin");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Something went wrong."));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!email) {
      toast.error("Enter your email above first.");
      return;
    }
    if (!csrfToken) {
      toast.error("Security token missing. Please refresh.");
      return;
    }

    try {
      const callbackParams = buildCallbackParams();
      callbackParams.set("recovery", "1");
      const redirectTo = `${siteUrl}/auth/callback?${callbackParams.toString()}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;
      toast.success("Password reset link sent. Check your email.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Could not send reset email."));
    }
  };

  return (
    <SignInPage
      authMode={authMode}
      onAuthModeChange={setAuthMode}
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={defaultTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      googleLoading={googleLoading}
      submitLoading={submitLoading}
    />
  );
}
