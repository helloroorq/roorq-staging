# 🚀 Vercel Deployment Instructions

## ✅ Pre-Deployment Checklist

All production readiness checks have been completed:
- ✅ Build tested successfully (41 pages generated)
- ✅ Hardcoded values removed
- ✅ Environment variables configured
- ✅ Test connection page protected
- ✅ No blocking errors

## 📋 Required Environment Variables

Before deploying, ensure these environment variables are set in Vercel:

### Required for Production:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
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

## 🚀 Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub** (if not already):
   ```bash
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"

3. **Import Repository**:
   - Select your GitHub repository
   - Vercel will auto-detect Next.js settings

4. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - Set for **Production**, **Preview**, and **Development**

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

6. **Update Supabase Auth URLs**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set **Site URL**: `https://your-app.vercel.app`
   - Add **Redirect URLs**:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/auth`

### Method 2: Deploy via Vercel CLI

1. **Login to Vercel**:
   ```bash
   npx vercel login
   ```

2. **Deploy**:
   ```bash
   npx vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables

4. **Redeploy** (to apply env vars):
   ```bash
   npx vercel --prod
   ```

## ✅ Post-Deployment Checklist

- [ ] Verify site loads at `https://your-app.vercel.app`
- [ ] Test authentication flow
- [ ] Test product browsing
- [ ] Test cart functionality
- [ ] Test checkout (COD flow)
- [ ] Test admin panel access
- [ ] Verify Supabase auth URLs are updated
- [ ] Test payment flow (if UPI is enabled)

## 🔧 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all required packages are in `package.json`
- Check build logs in Vercel dashboard

### Authentication Issues
- Verify Supabase auth URLs are configured
- Check environment variables are set
- Verify redirect URLs match exactly

## 📝 Notes

- The `vercel.json` file has been created with optimal settings
- Build tested successfully with 41 pages
- All hardcoded values have been removed
- Test connection page is protected (only shows in development)


