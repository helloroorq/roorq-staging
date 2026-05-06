'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client';

type ExistingReview = {
  rating: number;
  reviewText: string | null;
} | null;

type VendorReviewCardProps = {
  vendorOrderId: string;
  initialReview: ExistingReview;
};

export default function VendorReviewCard({ vendorOrderId, initialReview }: VendorReviewCardProps) {
  const [csrfToken, setCsrfToken] = useState('');
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [reviewText, setReviewText] = useState(initialReview?.reviewText ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCsrfToken(getOrCreateCsrfToken());
  }, []);

  const handleSubmit = async () => {
    if (!csrfToken) {
      toast.error('Security token missing. Refresh and try again.');
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorOrderId,
          rating,
          reviewText: reviewText.trim(),
          csrf: csrfToken,
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        toast.error(data.error ?? 'Could not submit review.');
        return;
      }

      toast.success('Review saved. Thanks for helping the community.');
    } catch {
      toast.error('Review submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Trust & Reviews</p>
      <p className="mt-1 text-sm text-gray-700">Rate your delivery experience with this seller.</p>

      <div className="mt-3 flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, idx) => {
          const value = idx + 1;
          const selected = value <= rating;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded-full p-1 transition hover:bg-yellow-50"
              aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
            >
              <Star
                className={`h-5 w-5 ${selected ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'}`}
              />
            </button>
          );
        })}
      </div>

      <textarea
        value={reviewText}
        onChange={(event) => setReviewText(event.target.value)}
        maxLength={500}
        rows={3}
        className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
        placeholder="Quick notes on quality, communication, and delivery speed."
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{reviewText.length}/500</span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {initialReview ? 'Update review' : 'Submit review'}
        </button>
      </div>
    </div>
  );
}
