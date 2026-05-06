import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type ReferralUser = {
  email: string | null;
  full_name: string | null;
};

type ReferralRow = {
  id: string;
  status: 'pending' | 'eligible' | 'claimed' | string;
  reward_category?: string | null;
  created_at: string;
  referrer?: ReferralUser | null;
  invitee?: ReferralUser | null;
};

type RewardRow = {
  id: string;
  category: string;
  status: 'available' | 'claimed' | 'expired' | string;
  created_at: string;
  user?: ReferralUser | null;
  product?: { name: string | null } | null;
};

export default async function AdminReferralsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth');
  }

  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      *,
      referrer:users!referrals_referrer_id_fkey(email, full_name),
      invitee:users!referrals_invitee_id_fkey(email, full_name)
    `)
    .order('created_at', { ascending: false });

  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select(`
      *,
      user:users(email, full_name),
      product:products(name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Referrals & Rewards</h1>

        {/* Referrals */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Referrals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invitee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {referrals && referrals.length > 0 ? (
                  (referrals as ReferralRow[]).map((referral) => (
                    <tr key={referral.id}>
                      <td className="px-6 py-4">{referral.referrer?.email || 'N/A'}</td>
                      <td className="px-6 py-4">{referral.invitee?.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          referral.status === 'eligible' ? 'bg-green-100 text-green-800' :
                          referral.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{referral.reward_category || '-'}</td>
                      <td className="px-6 py-4">{new Date(referral.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No referrals yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Rewards</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rewards && rewards.length > 0 ? (
                  (rewards as RewardRow[]).map((reward) => (
                    <tr key={reward.id}>
                      <td className="px-6 py-4">{reward.user?.email || 'N/A'}</td>
                      <td className="px-6 py-4">{reward.category}</td>
                      <td className="px-6 py-4">{reward.product?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          reward.status === 'available' ? 'bg-green-100 text-green-800' :
                          reward.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reward.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(reward.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No rewards yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
