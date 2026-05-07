"use client";

import React, { useState } from "react";
import { Eye as EyeBase, EyeOff as EyeOffBase } from "lucide-react";
const Eye = EyeBase as unknown as React.FC<{ className?: string }>;
const EyeOff = EyeOffBase as unknown as React.FC<{ className?: string }>;

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  authMode?: "signin" | "signup";
  onAuthModeChange?: (mode: "signin" | "signup") => void;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: (email: string) => void;
  googleLoading?: boolean;
  submitLoading?: boolean;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({
  testimonial,
  delayClass,
}: {
  testimonial: Testimonial;
  delayClass: string;
}) => (
  <div
    className={`animate-testimonial ${delayClass} flex w-64 max-w-[90vw] items-start gap-3 rounded-3xl border border-white/10 bg-zinc-900/40 p-5 text-white backdrop-blur-xl`}
  >
    <img
      src={testimonial.avatarSrc}
      className="h-10 w-10 rounded-2xl object-cover"
      alt={testimonial.name}
      referrerPolicy="no-referrer"
    />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-zinc-400">{testimonial.handle}</p>
      <p className="mt-1 text-white/85">{testimonial.text}</p>
    </div>
  </div>
);

export const SignInPage: React.FC<SignInPageProps> = ({
  title,
  description = "Access your account and continue your journey with us.",
  heroImageSrc,
  testimonials = [],
  authMode = "signin",
  onAuthModeChange,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  googleLoading,
  submitLoading,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  const defaultTitle =
    authMode === "signup" ? (
      <span className="font-semibold tracking-tight text-white">Create account</span>
    ) : (
      <span className="font-light tracking-tighter text-white">Welcome</span>
    );

  const resolvedTitle = title ?? defaultTitle;

  const resolvedDescription =
    typeof description === "string" && authMode === "signup"
      ? "Join Roorq and start shopping curated vintage with campus delivery."
      : description;

  return (
    <div className="flex min-h-[100dvh] w-full max-w-[100dvw] flex-col font-sans md:flex-row">
      <section className="flex flex-1 items-center justify-center bg-black p-8 text-white">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight md:text-5xl">
              {resolvedTitle}
            </h1>
            <p className="animate-element animate-delay-200 text-zinc-400">{resolvedDescription}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-zinc-400" htmlFor="signin-email">
                  Email Address
                </label>
                <GlassInputWrapper>
                  <input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-zinc-400" htmlFor="signin-password">
                  Password
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-400 transition-colors hover:text-white" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-400 transition-colors hover:text-white" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {authMode === "signup" ? (
                <div className="animate-element animate-delay-450">
                  <label className="text-sm font-medium text-zinc-400" htmlFor="signin-confirm">
                    Confirm password
                  </label>
                  <GlassInputWrapper>
                    <input
                      id="signin-confirm"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                  </GlassInputWrapper>
                </div>
              ) : null}

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox h-4 w-4" />
                  <span className="text-white/90">Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onResetPassword?.(email.trim());
                  }}
                  className="text-violet-400 transition-colors hover:underline"
                >
                  Reset password
                </button>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-white py-4 font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitLoading ? "Please wait…" : authMode === "signup" ? "Create account" : "Sign In"}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-white/10" />
              <span className="absolute bg-black px-4 text-sm text-zinc-400">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading}
              className="animate-element animate-delay-800 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 py-4 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {googleLoading ? "Connecting…" : "Continue with Google"}
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-zinc-400">
              {authMode === "signin" ? (
                <>
                  New to our platform?{" "}
                  <button
                    type="button"
                    onClick={() => onAuthModeChange?.("signup")}
                    className="text-violet-400 transition-colors hover:underline"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => onAuthModeChange?.("signin")}
                    className="text-violet-400 transition-colors hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {heroImageSrc ? (
        <section className="relative hidden flex-1 p-4 md:block">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          />
          {testimonials.length > 0 ? (
            <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
              <TestimonialCard testimonial={testimonials[0]} delayClass="animate-delay-1000" />
              {testimonials[1] ? (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delayClass="animate-delay-1200" />
                </div>
              ) : null}
              {testimonials[2] ? (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delayClass="animate-delay-1400" />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};
