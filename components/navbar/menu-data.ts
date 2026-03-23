import type { LucideIcon } from 'lucide-react'
import {
  Compass,
  Flame,
  Gift,
  HeartHandshake,
  Layers3,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Tag,
  Trophy,
} from 'lucide-react'

export type CategoryMenuLink = {
  label: string
  href: string
  description: string
}

export type CategoryMenuSection = {
  title: string
  icon: LucideIcon
  links: CategoryMenuLink[]
}

export type CategoryMenu = {
  id: 'women' | 'men' | 'kids' | 'brands' | 'sports' | 'trending' | 'sale'
  label: string
  href: string
  description: string
  accent?: 'sale'
  match: {
    gender?: string
    category?: string
    pathname?: string
  }
  sections: CategoryMenuSection[]
  featured: {
    eyebrow: string
    title: string
    description: string
    href: string
    image: string
  }
}

export const CATEGORY_MENUS: CategoryMenu[] = [
  {
    id: 'women',
    label: 'Women',
    href: '/shop?gender=women',
    description: 'Vintage layers, easy denim, and faster browsing for the women feed.',
    match: { gender: 'women' },
    sections: [
      {
        title: 'Shop by category',
        icon: Shirt,
        links: [
          {
            label: "All women's vintage",
            href: '/shop?gender=women',
            description: 'Full women feed with the newest pieces first.',
          },
          {
            label: 'Jackets',
            href: '/shop?gender=women&category=jacket',
            description: 'Outerwear, bombers, and campus layering pieces.',
          },
          {
            label: 'Sweaters',
            href: '/shop?gender=women&category=sweater',
            description: 'Soft knits and oversized everyday staples.',
          },
          {
            label: 'Graphic tees',
            href: '/shop?gender=women&category=t-shirt',
            description: 'Vintage prints, band tees, and single-stitch finds.',
          },
        ],
      },
      {
        title: 'Trending now',
        icon: Flame,
        links: [
          {
            label: 'Denim rotation',
            href: '/shop?gender=women&category=jeans',
            description: 'Straight fits, faded washes, and daily denim picks.',
          },
          {
            label: 'Accessories',
            href: '/shop?gender=women&category=accessories',
            description: 'Bags, belts, scarves, and finishing details.',
          },
          {
            label: 'Sportcore',
            href: '/shop?gender=women&category=sportswear',
            description: 'Track layers and movement-ready campus looks.',
          },
          {
            label: 'New arrivals',
            href: '/shop?gender=women&sort=newest',
            description: 'Fresh uploads with the least competition.',
          },
        ],
      },
      {
        title: 'Popular searches',
        icon: Sparkles,
        links: [
          {
            label: 'Y2K edit',
            href: '/shop?gender=women&tag=y2k',
            description: 'Low-rise denim, tanks, and early-2000s silhouettes.',
          },
          {
            label: 'Nike',
            href: '/shop?gender=women&search=nike',
            description: 'Sportswear and vintage Nike essentials.',
          },
          {
            label: 'Adidas',
            href: '/shop?gender=women&search=adidas',
            description: 'Track jackets, tees, and archive stripes.',
          },
          {
            label: 'Carhartt',
            href: '/shop?gender=women&search=carhartt',
            description: 'Utility layers with heavier textures.',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Daily edit',
      title: 'Y2K layers and easy denim',
      description: 'A faster way to browse the women feed without getting lost in filters.',
      href: '/shop?gender=women&tag=y2k',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    },
  },
  {
    id: 'men',
    label: 'Men',
    href: '/shop?gender=men',
    description: 'Workwear, vintage sportswear, and sharper everyday staples.',
    match: { gender: 'men' },
    sections: [
      {
        title: 'Shop by category',
        icon: Layers3,
        links: [
          {
            label: "All men's vintage",
            href: '/shop?gender=men',
            description: 'The full men feed with the latest active listings.',
          },
          {
            label: 'Jackets',
            href: '/shop?gender=men&category=jacket',
            description: 'Workwear, varsity cuts, and cold-weather layers.',
          },
          {
            label: 'Sweaters',
            href: '/shop?gender=men&category=sweater',
            description: 'Heavy knits, fleece, and textured pullovers.',
          },
          {
            label: 'Trousers',
            href: '/shop?gender=men&category=trousers',
            description: 'Relaxed tailoring and everyday vintage bottoms.',
          },
        ],
      },
      {
        title: 'Trending now',
        icon: Trophy,
        links: [
          {
            label: 'Graphic tees',
            href: '/shop?gender=men&category=t-shirt',
            description: 'Single-stitch, sports, and faded print tees.',
          },
          {
            label: 'Denim',
            href: '/shop?gender=men&category=jeans',
            description: 'Straight, loose, and worn-in vintage washes.',
          },
          {
            label: 'Sportswear',
            href: '/shop?gender=men&category=sportswear',
            description: 'Warm-ups, track jackets, and easy training fits.',
          },
          {
            label: 'New arrivals',
            href: '/shop?gender=men&sort=newest',
            description: 'Fresh uploads before they disappear.',
          },
        ],
      },
      {
        title: 'Popular searches',
        icon: Star,
        links: [
          {
            label: 'Nike',
            href: '/shop?gender=men&search=nike',
            description: 'Vintage Nike layers and athletic staples.',
          },
          {
            label: 'Ralph Lauren',
            href: '/shop?gender=men&search=ralph',
            description: 'Clean prep, shirting, and embroidered classics.',
          },
          {
            label: 'Carhartt',
            href: '/shop?gender=men&search=carhartt',
            description: 'Workwear-heavy pieces with durable fabrics.',
          },
          {
            label: 'Adidas',
            href: '/shop?gender=men&search=adidas',
            description: 'Track tops and archive sportswear silhouettes.',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Utility edit',
      title: 'Workwear and athletic layers',
      description: 'The men feed is structured to get buyers from search to product faster.',
      href: '/shop?gender=men&search=carhartt',
      image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    },
  },
  {
    id: 'kids',
    label: 'Kids',
    href: '/shop?gender=kids',
    description: 'Smaller sizes, durable basics, and faster discovery for kids listings.',
    match: { gender: 'kids' },
    sections: [
      {
        title: 'Essentials',
        icon: Gift,
        links: [
          {
            label: 'All kids vintage',
            href: '/shop?gender=kids',
            description: 'Browse every kids listing in one place.',
          },
          {
            label: 'Jackets',
            href: '/shop?gender=kids&category=jacket',
            description: 'Outerwear and everyday campus-weather layers.',
          },
          {
            label: 'Sweaters',
            href: '/shop?gender=kids&category=sweater',
            description: 'Warm knits and easy layering pieces.',
          },
          {
            label: 'Tees',
            href: '/shop?gender=kids&category=t-shirt',
            description: 'Graphic basics and everyday tops.',
          },
        ],
      },
      {
        title: 'Quick picks',
        icon: Compass,
        links: [
          {
            label: 'Jeans',
            href: '/shop?gender=kids&category=jeans',
            description: 'Durable denim and easy weekend fits.',
          },
          {
            label: 'Sportswear',
            href: '/shop?gender=kids&category=sportswear',
            description: 'Track-inspired pieces and movement-ready sets.',
          },
          {
            label: 'New arrivals',
            href: '/shop?gender=kids&sort=newest',
            description: 'Recently listed items with better availability.',
          },
          {
            label: 'Accessories',
            href: '/shop?gender=kids&category=accessories',
            description: 'Small add-ons that still convert well.',
          },
        ],
      },
      {
        title: 'Helpful shortcuts',
        icon: HeartHandshake,
        links: [
          {
            label: 'Safe buying',
            href: '/faq',
            description: 'Campus delivery, support, and checkout guidance.',
          },
          {
            label: 'Shipping info',
            href: '/shipping-policy',
            description: 'Delivery expectations before checkout.',
          },
          {
            label: 'Returns policy',
            href: '/returns-policy',
            description: 'Know the process before you place an order.',
          },
          {
            label: 'Sizing help',
            href: '/sizing',
            description: 'Reference sizing before ordering smaller pieces.',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Family archive',
      title: 'Smaller sizes, cleaner browsing',
      description: 'Kids listings stay easy to scan with clearer categories and fast pickup routes.',
      href: '/shop?gender=kids&sort=newest',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    },
  },
  {
    id: 'brands',
    label: 'Brands',
    href: '/shop',
    description: 'Brand-led discovery for buyers who shop by label first.',
    match: {},
    sections: [
      {
        title: 'Most searched',
        icon: Sparkles,
        links: [
          {
            label: 'Nike',
            href: '/shop?search=nike',
            description: 'Vintage Nike layers, tees, and easy sportswear staples.',
          },
          {
            label: 'Adidas',
            href: '/shop?search=adidas',
            description: 'Archive stripes, track jackets, and classic warm-up pieces.',
          },
          {
            label: 'Ralph Lauren',
            href: '/shop?search=ralph',
            description: 'Clean prep, shirting, and embroidered essentials.',
          },
          {
            label: 'Carhartt',
            href: '/shop?search=carhartt',
            description: 'Heavier workwear with a strong resale pull.',
          },
        ],
      },
      {
        title: 'Fashion labels',
        icon: Trophy,
        links: [
          {
            label: 'Levi’s',
            href: '/shop?search=levi',
            description: 'Denim-heavy browsing with faster product discovery.',
          },
          {
            label: 'Tommy Hilfiger',
            href: '/shop?search=tommy',
            description: 'Logo knits, shirting, and vintage Americana.',
          },
          {
            label: 'Harley Davidson',
            href: '/shop?search=harley',
            description: 'Graphic tees and heavier statement outerwear.',
          },
          {
            label: 'The North Face',
            href: '/shop?search=north+face',
            description: 'Outerwear and technical layers with strong conversion.',
          },
        ],
      },
      {
        title: 'Shortcuts',
        icon: Compass,
        links: [
          {
            label: 'Newest branded listings',
            href: '/shop?sort=newest',
            description: 'Fresh branded uploads before they get buried.',
          },
          {
            label: 'Under sale',
            href: '/shop?category=sale',
            description: 'Brand-led deals with a lower entry price.',
          },
          {
            label: 'Women by brand',
            href: '/shop?gender=women',
            description: 'Use brand searches inside the women feed.',
          },
          {
            label: 'Men by brand',
            href: '/shop?gender=men',
            description: 'Combine label intent with the men marketplace rail.',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Label-first browsing',
      title: 'Discover by brand, not just category',
      description: 'Built for shoppers who know exactly which labels they trust and want to move fast.',
      href: '/shop?search=nike',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    },
  },
  {
    id: 'sports',
    label: 'Sports',
    href: '/shop?category=sportswear',
    description: 'Archive sportswear, campus movement fits, and brand-led discovery.',
    match: { category: 'sportswear' },
    sections: [
      {
        title: 'Shop by feed',
        icon: ShieldCheck,
        links: [
          {
            label: 'All sportswear',
            href: '/shop?category=sportswear',
            description: 'Every active sportswear listing in one feed.',
          },
          {
            label: 'Women',
            href: '/shop?gender=women&category=sportswear',
            description: 'Track layers and movement-ready women picks.',
          },
          {
            label: 'Men',
            href: '/shop?gender=men&category=sportswear',
            description: 'Warm-ups, jackets, and athletic basics.',
          },
          {
            label: 'Kids',
            href: '/shop?gender=kids&category=sportswear',
            description: 'Smaller-size trackwear and sports staples.',
          },
        ],
      },
      {
        title: 'Popular brands',
        icon: Sparkles,
        links: [
          {
            label: 'Nike',
            href: '/shop?search=nike',
            description: 'Vintage Nike tees, track jackets, and outerwear.',
          },
          {
            label: 'Adidas',
            href: '/shop?search=adidas',
            description: 'Archive stripes and old-school warm-up pieces.',
          },
          {
            label: 'Jerseys',
            href: '/shop?search=jersey',
            description: 'Match-day silhouettes and collectible tops.',
          },
          {
            label: 'Running layers',
            href: '/shop?search=track',
            description: 'Lightweight movement pieces with quick turnover.',
          },
        ],
      },
      {
        title: 'Fast entry points',
        icon: Flame,
        links: [
          {
            label: 'Newest drops',
            href: '/shop?category=sportswear&sort=newest',
            description: 'Fresh uploads before they are searched out.',
          },
          {
            label: 'Campus pickup ready',
            href: '/events',
            description: 'Browse marketplace activity around live drops.',
          },
          {
            label: 'Seller hub',
            href: '/sell',
            description: 'List sportswear inventory with a cleaner storefront.',
          },
          {
            label: 'Shop all brands',
            href: '/shop',
            description: 'Jump back into the full marketplace if needed.',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Movement edit',
      title: 'Track jackets, jerseys, and archive warm-ups',
      description: 'A tighter sportswear rail that behaves like a real fashion marketplace.',
      href: '/shop?category=sportswear&sort=newest',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    },
  },
  {
    id: 'trending',
    label: 'Trending',
    href: '/shop?sort=newest',
    description: 'Fast-moving listings, hot searches, and discovery-first marketplace rails.',
    match: {},
    sections: [
      {
        title: 'Right now',
        icon: Compass,
        links: [
          {
            label: 'Newest arrivals',
            href: '/shop?sort=newest',
            description: 'Fresh listings with the highest first-day engagement.',
          },
          {
            label: 'Popular this week',
            href: '/shop?sort=bestsellers',
            description: 'Listings that are already drawing repeat views.',
          },
          {
            label: 'Y2K picks',
            href: '/shop?tag=y2k',
            description: 'Search-led trend browsing for fast-moving looks.',
          },
          {
            label: 'Campus favorites',
            href: '/shop?search=vintage',
            description: 'A wider rail of core vintage pieces that keep converting.',
          },
        ],
      },
      {
        title: 'Marketplace depth',
        icon: Flame,
        links: [
          {
            label: 'Women trending',
            href: '/shop?gender=women&sort=newest',
            description: 'Women’s rail filtered for faster fresh discovery.',
          },
          {
            label: 'Men trending',
            href: '/shop?gender=men&sort=newest',
            description: 'Men’s rail with recent uploads at the top.',
          },
          {
            label: 'Sports trending',
            href: '/shop?category=sportswear&sort=newest',
            description: 'Sports and archive layers with strong click intent.',
          },
          {
            label: 'Price drops',
            href: '/shop?category=sale&sort=newest',
            description: 'Fresh markdowns and quick-conversion inventory.',
          },
        ],
      },
      {
        title: 'Read and browse',
        icon: Trophy,
        links: [
          {
            label: 'Editorial',
            href: '/editorial',
            description: 'Stories and content that still drive marketplace intent.',
          },
          {
            label: 'Drops',
            href: '/drops',
            description: 'Release energy and weekly urgency around new stock.',
          },
          {
            label: 'Events',
            href: '/events',
            description: 'Campus activity and live marketplace moments.',
          },
          {
            label: 'Membership',
            href: '/membership',
            description: 'Retention and loyalty incentives for repeat buyers.',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Hot rail',
      title: 'Trend-led browsing without the clutter',
      description: 'A faster entry point for high-intent shoppers who want a reason to keep scrolling.',
      href: '/shop?sort=newest',
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
    },
  },
  {
    id: 'sale',
    label: 'Sale',
    href: '/shop?category=sale',
    description: 'Lower-friction entry points for price-sensitive buyers.',
    accent: 'sale',
    match: { category: 'sale' },
    sections: [
      {
        title: 'Start here',
        icon: Tag,
        links: [
          {
            label: 'Sale feed',
            href: '/shop?category=sale',
            description: 'See every marked-down listing in one place.',
          },
          {
            label: 'Price low to high',
            href: '/shop?category=sale&sort=price_asc',
            description: 'Quickest way to browse cheaper listings first.',
          },
          {
            label: 'Newest markdowns',
            href: '/shop?category=sale&sort=newest',
            description: 'Fresh price drops before they get buried.',
          },
          {
            label: 'Last chance',
            href: '/shop?category=sale&search=last',
            description: 'Search-driven route for end-of-run inventory.',
          },
        ],
      },
      {
        title: 'Affordable picks',
        icon: Gift,
        links: [
          {
            label: 'Denim deals',
            href: '/shop?category=sale&search=jeans',
            description: 'Sale-first denim browsing without extra filtering.',
          },
          {
            label: 'Outerwear deals',
            href: '/shop?category=sale&search=jacket',
            description: 'Marked-down layers with faster turnover.',
          },
          {
            label: 'Sportswear deals',
            href: '/shop?category=sale&search=sportswear',
            description: 'Discounted athletic pieces and archive basics.',
          },
          {
            label: 'Accessories deals',
            href: '/shop?category=sale&search=accessories',
            description: 'Lower-ticket items that convert quickly.',
          },
        ],
      },
      {
        title: 'Marketplace support',
        icon: HeartHandshake,
        links: [
          {
            label: 'Safe checkout',
            href: '/faq',
            description: 'How COD and campus support work before checkout.',
          },
          {
            label: 'Returns policy',
            href: '/returns-policy',
            description: 'Know the process before buying discounted stock.',
          },
          {
            label: 'Shipping policy',
            href: '/shipping-policy',
            description: 'Delivery timelines and pickup expectations.',
          },
          {
            label: 'Contact support',
            href: '/contact',
            description: 'Get help if a sale item needs more detail.',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Price drop',
      title: 'Marked-down pieces with faster conversion',
      description: 'The sale rail is built to get buyers to product detail with less friction.',
      href: '/shop?category=sale&sort=price_asc',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    },
  },
]
