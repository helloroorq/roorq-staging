import { redirect } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Sign Up',
  description: 'Create your Roorq account.',
  path: '/signup',
  noIndex: true,
});

export default function SignupPage({ searchParams }: { searchParams: { ref?: string } }) {
  // Redirect to login page, preserving referral code if present
  // The login page now handles both "Sign In" and "Sign Up" logic via OTP/Magic Link
  const params = new URLSearchParams();
  if (searchParams.ref) {
    params.set('ref', searchParams.ref);
  }
  
  redirect(`/auth?${params.toString()}`);
}
