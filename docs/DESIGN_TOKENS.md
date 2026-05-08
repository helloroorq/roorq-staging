# ROORQ Design Tokens

Canonical token spec. The web app (`apps/web`) is the source of truth. The vendor PWA (`apps/vendor-app`) mirrors these as a TS object in `lib/theme.ts` because React Native cannot consume CSS variables natively.

## Where they live

- `apps/web/app/globals.css` — `:root` and `:root[data-theme="dark"]` blocks define CSS custom properties as **space-separated RGB triplets** (e.g. `139 26 26`). This format lets Tailwind use `rgb(var(--rq-brand) / <alpha-value>)` so utilities like `bg-rq-brand/80` work.
- `apps/web/tailwind.config.ts` — `theme.extend.colors` exposes each token as a Tailwind colour key (`rq-bg`, `rq-surface`, etc.).

## Token table

| Name              | Light value (RGB) | Hex      | Role                                                         |
|-------------------|-------------------|----------|--------------------------------------------------------------|
| `--rq-bg`         | `247 244 238`     | #F7F4EE  | Page background (warm off-white)                             |
| `--rq-surface`    | `255 255 255`     | #FFFFFF  | Card / sheet / modal surface                                 |
| `--rq-ink`        | `23 23 23`        | #171717  | Primary text                                                 |
| `--rq-ink-muted`  | `115 115 115`     | #737373  | Secondary text, captions                                     |
| `--rq-brand`      | `139 26 26`       | #8B1A1A  | Primary CTA, links, brand accents (dark crimson)             |
| `--rq-brand-ink`  | `255 255 255`     | #FFFFFF  | Text/icon colour rendered on top of `--rq-brand`             |
| `--rq-accent`     | `236 224 208`     | #ECE0D0  | Hero panels, soft callouts (warm beige)                      |
| `--rq-success`    | `22 163 74`       | #16A34A  | Success states (order confirmed, payment captured)           |
| `--rq-warn`       | `217 119 6`       | #D97706  | Warning states (low stock, payout pending)                   |
| `--rq-danger`     | `220 38 38`       | #DC2626  | Destructive actions, error states                            |
| `--rq-line`       | `229 229 229`     | #E5E5E5  | Hairline borders, dividers                                   |

## Dark variants

Defined under `:root[data-theme="dark"]`. Default light at launch — dark mode is post-launch, behind a `data-theme` toggle.

| Name              | Dark value (RGB) | Hex      |
|-------------------|------------------|----------|
| `--rq-bg`         | `17 17 17`       | #111111  |
| `--rq-surface`    | `24 24 27`       | #18181B  |
| `--rq-ink`        | `250 250 250`    | #FAFAFA  |
| `--rq-ink-muted`  | `161 161 170`    | #A1A1AA  |
| `--rq-brand`      | `220 38 38`      | #DC2626  |
| `--rq-brand-ink`  | `255 255 255`    | #FFFFFF  |
| `--rq-accent`     | `63 49 35`       | #3F3123  |
| `--rq-success`    | `34 197 94`      | #22C55E  |
| `--rq-warn`       | `245 158 11`     | #F59E0B  |
| `--rq-danger`     | `239 68 68`      | #EF4444  |
| `--rq-line`       | `39 39 42`       | #27272A  |

## Tailwind utilities

Token-driven utilities available across `apps/web`:

| Utility class       | Token            |
|---------------------|------------------|
| `bg-rq-bg`          | `--rq-bg`        |
| `bg-rq-surface`     | `--rq-surface`   |
| `text-rq-ink`       | `--rq-ink`       |
| `text-rq-ink-muted` | `--rq-ink-muted` |
| `bg-rq-brand`       | `--rq-brand`     |
| `text-rq-brand-ink` | `--rq-brand-ink` |
| `bg-rq-accent`      | `--rq-accent`    |
| `bg-rq-success`     | `--rq-success`   |
| `bg-rq-warn`        | `--rq-warn`      |
| `bg-rq-danger`      | `--rq-danger`    |
| `border-rq-line`    | `--rq-line`      |

Alpha is composable via Tailwind's slash syntax: `bg-rq-brand/80`, `border-rq-line/20`, etc.

## Sweep state

Definition of done = zero hex literals or off-palette `zinc-*` / `neutral-*` / `gray-*` Tailwind classes in buyer-journey routes (`/`, `/shop`, `/products/[id]`, `/cart`, `/checkout`, `/orders/[id]`).

| Surface                       | Status        |
|-------------------------------|---------------|
| `components/Footer.tsx`       | swept (proof) |
| `app/page.tsx` (homepage)     | pending       |
| `app/shop/**`                 | pending       |
| `app/products/[id]/**`        | pending       |
| `app/cart/**`                 | pending       |
| `app/checkout/**`             | pending       |
| `app/orders/[id]/**`          | pending       |
| `components/TopNav.tsx`       | pending       |
| `app/admin/**`                | pending       |
| `app/seller/**`               | pending       |

## Vendor mirror

`apps/vendor-app/lib/theme.ts` (Stream C) exports a TS object with the same token names — same RGB values, consumed by RN components via `rgb(${tokens.rqBrand})`.
