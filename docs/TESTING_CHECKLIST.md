# Testing Checklist - Database & API Fixes

## 1. Database Schema & RLS Fixes
- [ ] **Products Table**: Verify `gender` column exists and accepts ('men', 'women', 'unisex', 'kids').
- [ ] **RLS Policies**: 
    - [ ] Verify users can read their own orders.
    - [ ] Verify users can read their own referrals.
    - [ ] Verify public can read active products.

## 2. API Error Handling
### Shop Page (`/shop`)
- [ ] Test fetching products with invalid category (should not crash, just return empty).
- [ ] Test fetching with network error (should show user-friendly message).

### Referrals Page (`/referrals`)
- [ ] Test referrals query failure (should log error and handle gracefully).
- [ ] Test rewards query failure.

### Orders Page (`/orders/[id]`)
- [ ] Test accessing order belonging to another user (should fail or return 404).
- [ ] Test accessing invalid order ID.

### Checkout Page (`/checkout`)
- [ ] Test checkout with failing inventory reservation.
- [ ] Test checkout with failing order creation.



