# Vendor onboarding funnel notes

## Funnel shape

1. **Landing and intent**: seller opens app and immediately sees "setup in under 1 minute".
2. **Identity basics**: collect only owner name + shop name.
3. **Ops basics**: collect WhatsApp number and pickup city.
4. **Selling profile**: collect catalog type and shipping speed.
5. **Activation moment**: send seller directly to `list-item` flow, not dashboard.

## Friction controls

- Keep onboarding at 3 short steps with progress dots.
- Avoid optional profile fields during activation.
- Always keep a visible Skip action for experienced sellers.
- Use tap-first controls (chips/pills) over heavy typing where possible.
- Route seller to first listing creation immediately after onboarding completion.

## Metrics to track next

- Start rate: `onboarding_started / app_opened`
- Completion rate: `onboarding_completed / onboarding_started`
- Time to first listing: from onboarding start to first successful listing submit
- Listing publish rate: `% of new listings set as Live`
- Week 1 retention: sellers with >=1 live listing after 7 days

## WhatsApp automation integration point

- Listing publish and order events call `queueVendorNotification(...)`.
- If `EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL` is configured, events post to webhook.
- If not configured, events are logged as stubs so the product can ship before automation backend is ready.
