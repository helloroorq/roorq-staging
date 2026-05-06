# Admin Guide

## Access
1. Sign in with an admin or super_admin account.
2. Visit `/admin`.
3. If you see "Forbidden", request admin access from a super_admin.

## Roles
- `super_admin`: full access, can manage roles
- `admin`: can manage orders, products, drops, riders, referrals

## Orders
1. Open **Orders** in the admin menu.
2. Use the status filter to narrow results.
3. Click an order to open the detail page.
4. Update status in order flow:
   - pending -> confirmed -> out_for_delivery -> delivered -> payment_collected
   - cancel at any point before payment_collected
5. Assign a rider before dispatching (`out_for_delivery`).
6. Use **Mark Payment Collected** after delivery.

## Riders
1. Open **Riders** in the admin menu.
2. Add rider name and phone.
3. Activate/deactivate riders as needed.
4. Assign riders in the order detail page.

## Products
1. Open **Products**.
2. Create or edit products.
3. Ensure `is_active` is true for sellable items.

## Drops
1. Open **Drops**.
2. Create weekly drops and publish them.
3. Assign products to active drops.

## Users
1. Open **Users** (super_admin only).
2. Change roles if required.

## Referrals
1. Open **Referrals**.
2. Review referrals and reward status.

## Common Admin Actions
- Refunds: COD-only in Phase 1 (no online refunds).
- RTO: use **Cancel / Mark RTO** on the order detail page.
- Delivery issues: update order status and add a cancellation reason if needed.
