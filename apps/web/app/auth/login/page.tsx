import { redirect } from 'next/navigation';

/**
 * REASON: Consolidating duplicate login systems
 * - /auth/page.tsx has better design with Google OAuth, email/phone OTP, signin/signup toggle
 * - /auth/login/page.tsx had simpler design causing confusion
 * - Redirecting /auth/login to /auth to maintain backward compatibility
 * - All auth flows now go through single unified /auth page
 */
export default function LoginPage({ 
  searchParams 
}: { 
  searchParams: { redirect?: string; ref?: string } 
}) {
  // Redirect to main auth page, preserving query params
  const params = new URLSearchParams();
  if (searchParams.redirect) {
    params.set('redirect', searchParams.redirect);
  }
  if (searchParams.ref) {
    params.set('ref', searchParams.ref);
  }
  
  redirect(`/auth?${params.toString()}`);
}
