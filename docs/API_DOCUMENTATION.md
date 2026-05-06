# API Documentation

Base URL: `/` (Next.js route handlers)

All requests use `Content-Type: application/json` unless stated.

## Auth

### POST /api/auth/otp
Send OTP for email or phone sign-in.

Request:
```json
{
  "method": "email|phone",
  "mode": "signin|signup",
  "email": "user@example.com",
  "phone": "9999999999",
  "redirect": "/checkout",
  "ref": "REFCODE",
  "csrf": "token-from-auth_csrf-cookie"
}
```

Response: 200 on success, 429 on rate-limit, 403 on CSRF failure.

### POST /api/auth/verify
Verify OTP and create a session.

Request:
```json
{
  "method": "email|phone",
  "email": "user@example.com",
  "phone": "9999999999",
  "token": "123456",
  "csrf": "token-from-auth_csrf-cookie"
}
```

### POST /api/auth/recovery
Send account recovery link.

Request:
```json
{
  "email": "user@example.com",
  "redirect": "/shop",
  "csrf": "token-from-auth_csrf-cookie"
}
```

## Checkout (COD)

### POST /api/checkout
Creates a COD order using the server-side RPC.

Request:
```json
{
  "items": [{ "productId": "uuid", "quantity": 1 }],
  "deliveryHostel": "Rajendra Bhawan",
  "deliveryRoom": "A-201",
  "phone": "+919999999999",
  "paymentMethod": "cod|upi",
  "csrf": "token-from-auth_csrf-cookie"
}
```

Response:
```json
{
  "orderId": "uuid",
  "orderNumber": "RQ-000123",
  "totalAmount": 1999
}
```

Errors:
- 400: validation error
- 401: unauthenticated
- 403: CSRF validation failed
- 429: rate limited
- 500: server error

## Admin

### GET /api/admin/users
Returns user list (admin/super_admin only).

### PATCH /api/admin/users
Update user role (super_admin only).

Request:
```json
{
  "userId": "uuid",
  "role": "customer|admin|super_admin",
  "csrf": "token-from-auth_csrf-cookie"
}
```

### PATCH /api/admin/orders/{id}
Update order status, assign rider, or cancel/collect payment.

Request (status update):
```json
{
  "status": "confirmed",
  "riderId": "uuid",
  "csrf": "token-from-auth_csrf-cookie"
}
```

Request (collect payment):
```json
{
  "action": "collect_payment",
  "riderId": "uuid",
  "csrf": "token-from-auth_csrf-cookie"
}
```

Request (cancel):
```json
{
  "action": "cancel",
  "cancellationReason": "rto",
  "csrf": "token-from-auth_csrf-cookie"
}
```

## Marketing

### POST /api/marketing/subscribe
Subscribe a user to Mailchimp.

Request:
```json
{
  "email": "user@example.com",
  "interests": ["tees", "denim"],
  "brands": ["brand-a"]
}
```
