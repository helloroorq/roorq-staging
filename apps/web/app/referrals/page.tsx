'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { Copy, Check, Gift, Share2, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useAuth } from '@/components/providers/AuthProvider';

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  referral_code: string | null;
};

type Referral = {
  id: string;
  status: 'pending' | 'eligible' | 'claimed' | string;
  created_at: string;
  reward_category?: string | null;
  invitee_id?: string | null;
};

type ReferralReward = {
  id: string;
  status: 'available' | 'claimed' | 'expired' | string;
  category: string;
  created_at: string;
};

export default function ReferralsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile as UserProfile);

      const { data: refs, error: refsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (refsError) throw refsError;
      setReferrals((refs || []) as Referral[]);

      const { data: rewardData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select(`*, product:products(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rewardsError) throw rewardsError;
      setRewards((rewardData || []) as ReferralReward[]);

    } catch (err: unknown) {
      logger.error('Error loading referrals', err instanceof Error ? err : undefined);
      setError('Failed to load referral data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/auth?redirect=/referrals');
      return;
    }

    void loadData();
  }, [authLoading, loadData, router, user]);

  const copyReferralLink = () => {
    const code = userProfile?.referral_code ?? '';
    if (!code) {
      setError('Referral code is not ready yet. Please refresh the page.');
      return;
    }
    const link = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referralLink = userProfile 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${userProfile.referral_code}`
    : '';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Navbar />
      
      <div className="flex-1 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {error ? (
          <div className="max-w-4xl mx-auto text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-black text-white px-6 py-2 rounded">
              Refresh Page
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-center">
              Refer a Friend. <span className="text-gray-400">Get It Free.</span>
            </h1>
            <p className="text-gray-500 text-center uppercase tracking-widest mb-12 font-medium">
              Zero-cost growth loop. Unlimited rewards.
            </p>

            {/* Generate Link Section */}
            <div className="bg-black text-white p-8 md:p-12 text-center mb-16 border border-gray-800 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Your Unique Invite Link</h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                  Refer a friend - when they buy their first order, you get the same-category item free.
                </p>
                
                <button 
                  onClick={() => {
                    if (!userProfile?.referral_code) {
                      setError('Referral code is not ready yet. Please refresh the page.');
                      return;
                    }
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition transform hover:scale-105"
                >
                  Generate Referral Link <Share2 className="w-4 h-4" />
                </button>
              </div>
              {/* Abstract Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* Reward Status Cards */}
            <div className="mb-16">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 border-b pb-4">Reward Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending */}
                <div className="border border-gray-200 p-6 hover:border-black transition duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Pending</span>
                    <Clock className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-3xl font-black mb-1">{referrals.filter(r => r.status === 'pending').length}</p>
                  <p className="text-xs text-gray-500 uppercase">Friends joined, order pending</p>
                </div>

                {/* Eligible */}
                <div className="border border-gray-200 p-6 bg-black text-white relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Eligible</span>
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-black mb-1 relative z-10">{referrals.filter(r => r.status === 'eligible').length}</p>
                  <p className="text-xs text-gray-400 uppercase relative z-10">Rewards ready to claim</p>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500 rounded-full blur-xl opacity-20"></div>
                </div>

                {/* Claimed */}
                <div className="border border-gray-200 p-6 hover:border-black transition duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-green-600">Claimed</span>
                    <Check className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-3xl font-black mb-1">{referrals.filter(r => r.status === 'claimed').length}</p>
                  <p className="text-xs text-gray-500 uppercase">Rewards redeemed</p>
                </div>
              </div>
            </div>

            {/* Available Rewards List */}
            {rewards.filter(r => r.status === 'available').length > 0 && (
              <div className="mb-16">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6 border-b pb-4">Claim Rewards</h3>
                <div className="space-y-4">
                  {rewards.filter(r => r.status === 'available').map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-6 border border-black bg-gray-50">
                      <div>
                        <p className="font-black uppercase text-lg">Free {reward.category}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Earned from referral</p>
                      </div>
                      <a
                        href="/contact?topic=referral-reward"
                        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition"
                      >
                        Claim Reward
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referral History List */}
            <div className="mb-12">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 border-b pb-4">Referral History</h3>
              {referrals.length > 0 ? (
                <div className="space-y-0 border-t border-gray-100">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition">
                      <div>
                        <p className="font-bold text-sm">
                          {referral.invitee_id
                            ? `Invitee #${referral.invitee_id.slice(0, 6).toUpperCase()}`
                            : 'Unknown User'}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                        referral.status === 'eligible' ? 'border-black bg-black text-white' : 
                        referral.status === 'pending' ? 'border-gray-200 text-gray-400' : 
                        'border-green-600 text-green-600'
                      }`}>
                        {referral.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-300">
                  <p className="text-gray-400 text-sm uppercase tracking-widest">No referrals yet. Start sharing!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              x
            </button>
            
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Share Your Link</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-8">Give value, get value.</p>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-sm focus:outline-none focus:border-black transition"
              />
              <button
                onClick={copyReferralLink}
                className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition border border-black ${
                  copied ? 'bg-green-600 text-white border-green-600' : 'bg-black text-white hover:bg-white hover:text-black'
                }`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a 
                href={`https://wa.me/?text=Check%20out%20Roorq%20-%20Use%20my%20link%20for%20exclusive%20campus%20drops:%20${encodeURIComponent(referralLink)}`}
                target="_blank"
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 hover:border-green-500 hover:text-green-600 transition uppercase text-xs font-bold tracking-widest"
              >
                WhatsApp
              </a>
              <a 
                href={`mailto:?subject=Roorq%20Invite&body=Use%20my%20referral%20link:%20${encodeURIComponent(referralLink)}`}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 hover:border-black hover:text-black transition uppercase text-xs font-bold tracking-widest"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
