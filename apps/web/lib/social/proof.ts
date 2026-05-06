export type TrustBadgeKey =
  | 'verified_seller'
  | 'trusted_dispatch'
  | 'authenticity_passed'
  | 'top_responder'
  | 'repeat_buyers'
  | 'trusted_buyer'
  | 'verified_collector'

export type TrustBadge = {
  key: TrustBadgeKey
  label: string
  description: string
}

export type ProductReview = {
  id: string
  buyerId: string
  buyerName: string
  buyerHostel: string
  rating: number
  verifiedPurchase: boolean
  comment: string
  helpfulCount: number
  createdAtLabel: string
}

export type ProductSocialProof = {
  averageRating: number
  reviewCount: number
  saveCount: number
  soldCount: number
  viewedInLast24h: number
  friendsSavedCount: number
  sellerResponseMinutes: number
  badges: TrustBadge[]
  reviews: ProductReview[]
}

export type SellerSocialProof = {
  followerCount: number
  repeatBuyerRate: number
  averageRating: number
  reviewCount: number
  responseMinutes: number
  fulfilmentRate: number
  badges: TrustBadge[]
}

export type BuyerSocialProfile = {
  displayName: string
  bio: string
  followerCount: number
  followingCount: number
  reviewsWritten: number
  helpfulVotesEarned: number
  badges: TrustBadge[]
  styleTags: string[]
}

const REVIEW_SNIPPETS = [
  'Looks exactly like the photos. Fabric and fit were spot on.',
  'Delivery was fast and packed cleanly. Great vintage condition.',
  'Seller replied with extra measurements quickly before I bought.',
  'Wore it for a campus event and got asked where I found it.',
  'No surprises in quality. Happy with the purchase.',
  'Good pricing for the brand and condition.',
]

const BUYER_NAMES = ['Aarav', 'Siya', 'Kabir', 'Anaya', 'Rhea', 'Vihaan', 'Ira', 'Arjun']
const HOSTELS = ['Rajendra Bhawan', 'Govind Bhawan', 'Sarojini Bhawan', 'Kasturba Bhawan', 'Vigyan Kunj']
const STYLE_TAGS = ['Vintage Denim', 'Streetwear', 'Sportcore', 'Campus Minimal', 'Retro Utility', 'Layered Fits']

const hashSeed = (seed: string) => {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash
}

const pick = <T,>(items: T[], hash: number, offset: number) => items[(hash + offset) % items.length]

const getBaseTrustBadges = (): TrustBadge[] => [
  {
    key: 'verified_seller',
    label: 'Verified seller',
    description: 'Identity and payout account are verified by Roorq.',
  },
  {
    key: 'authenticity_passed',
    label: 'Authenticity checks',
    description: 'Listings pass visual quality and authenticity checks.',
  },
  {
    key: 'trusted_dispatch',
    label: 'Reliable dispatch',
    description: 'Dispatches orders consistently within promised window.',
  },
]

export const buildProductSocialProof = (productId: string, sellerId: string): ProductSocialProof => {
  const hash = hashSeed(`${productId}:${sellerId}`)
  const reviewCount = 18 + (hash % 56)
  const averageRating = Number((4.2 + ((hash % 7) * 0.1)).toFixed(1))
  const saveCount = 28 + (hash % 220)
  const soldCount = 5 + (hash % 42)
  const viewedInLast24h = 30 + (hash % 180)
  const friendsSavedCount = 1 + (hash % 7)
  const sellerResponseMinutes = 6 + (hash % 34)

  const reviews: ProductReview[] = Array.from({ length: 4 }).map((_, index) => {
    const reviewHash = hashSeed(`${productId}:${index}`)
    const rating = 4 + (reviewHash % 2)

    return {
      id: `${productId}-review-${index + 1}`,
      buyerId: `buyer-${(reviewHash % 91) + 1}`,
      buyerName: pick(BUYER_NAMES, reviewHash, index),
      buyerHostel: pick(HOSTELS, reviewHash, index + 2),
      rating,
      verifiedPurchase: true,
      comment: pick(REVIEW_SNIPPETS, reviewHash, index),
      helpfulCount: 2 + (reviewHash % 18),
      createdAtLabel: `${2 + (reviewHash % 20)} days ago`,
    }
  })

  return {
    averageRating,
    reviewCount,
    saveCount,
    soldCount,
    viewedInLast24h,
    friendsSavedCount,
    sellerResponseMinutes,
    badges: [
      ...getBaseTrustBadges(),
      {
        key: 'top_responder',
        label: 'Quick responder',
        description: 'Median first response under one hour.',
      },
    ],
    reviews,
  }
}

export const buildSellerSocialProof = (sellerId: string): SellerSocialProof => {
  const hash = hashSeed(sellerId)
  const reviewCount = 30 + (hash % 190)

  return {
    followerCount: 120 + (hash % 1400),
    repeatBuyerRate: 18 + (hash % 34),
    averageRating: Number((4.3 + ((hash % 6) * 0.1)).toFixed(1)),
    reviewCount,
    responseMinutes: 9 + (hash % 32),
    fulfilmentRate: 92 + (hash % 7),
    badges: [
      ...getBaseTrustBadges(),
      {
        key: 'repeat_buyers',
        label: 'High repeat buyers',
        description: 'Strong repeat-purchase behavior from past buyers.',
      },
    ],
  }
}

export const buildBuyerSocialProfile = (buyerId: string): BuyerSocialProfile => {
  const hash = hashSeed(buyerId)
  const styleTags = Array.from({ length: 3 }).map((_, index) => pick(STYLE_TAGS, hash, index))

  return {
    displayName: `${pick(BUYER_NAMES, hash, 0)} C.`,
    bio: 'Campus buyer sharing concise fit-and-quality reviews to help others buy with confidence.',
    followerCount: 20 + (hash % 170),
    followingCount: 14 + (hash % 140),
    reviewsWritten: 6 + (hash % 70),
    helpfulVotesEarned: 18 + (hash % 300),
    badges: [
      {
        key: 'trusted_buyer',
        label: 'Trusted buyer',
        description: 'Consistent verified purchases and accurate reviews.',
      },
      {
        key: 'verified_collector',
        label: 'Verified collector',
        description: 'Public profile with repeat activity in vintage categories.',
      },
    ],
    styleTags,
  }
}
