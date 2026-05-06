# Quick Vercel Deployment Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Test Build Locally

```bash
npm run build
```

If the build succeeds, you're ready for Vercel.

## Step 3: Push to GitHub

```bash
git add .
git commit -m "Prepare deployment"
git push
```

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

## Step 5: Add Environment Variables

In Vercel Dashboard -> Your Project -> Settings -> Environment Variables, add:

### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

### Optional (feature-based):

```
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_AUDIENCE_ID=your_mailchimp_audience_id
NEXT_PUBLIC_GA_ID=your_google_analytics_id
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn
```

**Important:**
- Set these for **Production**, **Preview**, and **Development** environments
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-side only

## Step 6: Deploy

Click "Deploy" and wait for the build to complete.

## Step 7: Configure Supabase

### Update Auth URLs:
1. Go to Supabase Dashboard -> Authentication -> URL Configuration
2. Set **Site URL:** `https://your-app.vercel.app`
3. Add **Redirect URLs:**
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/auth`

### Deploy Edge Functions:
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions (only those you use)
supabase functions deploy notify
```

### Set Edge Function Secrets:
In Supabase Dashboard -> Edge Functions -> Secrets, add:
- `RESEND_API_KEY`

## Step 8: Test Your Deployment

1. Visit your Vercel URL
2. Test authentication flow
3. Test checkout (COD/UPI on delivery)
4. Test admin panel access

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

### Auth Not Working
- Verify Supabase URLs are updated
- Check redirect URLs in Supabase Dashboard
- Verify environment variables are set

## Need Help?

See `DEPLOYMENT_ANALYSIS.md` for detailed analysis and recommendations.
