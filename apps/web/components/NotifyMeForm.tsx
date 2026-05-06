'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type NotifyMeFormProps = {
  interest: string;
  placeholder: string;
  buttonLabel?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  successMessage?: string;
};

type SubscribeResponse = {
  success?: boolean;
  error?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NotifyMeForm({
  interest,
  placeholder,
  buttonLabel = 'Notify Me',
  className = 'flex gap-2',
  inputClassName = '',
  buttonClassName = '',
  successMessage = 'You are on the list. We will notify you first.',
}: NotifyMeFormProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      toast.error('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/marketing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          interests: [interest],
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as SubscribeResponse;

      if (!response.ok) {
        toast.error(payload.error || 'Subscription failed. Please try again.');
        return;
      }

      toast.success(successMessage);
      setEmail('');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={placeholder}
        required
        className={inputClassName}
      />
      <button type="submit" disabled={submitting} className={buttonClassName}>
        {submitting ? 'Sending...' : buttonLabel}
      </button>
    </form>
  );
}
