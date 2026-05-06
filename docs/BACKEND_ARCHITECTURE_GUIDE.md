# 🏗️ Backend Architecture Guide for Next.js + Supabase

## 📋 Table of Contents
1. [Backend Architecture Overview](#backend-architecture-overview)
2. [Current Project Analysis](#current-project-analysis)
3. [What's Missing](#whats-missing)
4. [Recommended Folder Structure](#recommended-folder-structure)
5. [Backend Concepts Explained](#backend-concepts-explained)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)

---

## 🎯 Backend Architecture Overview

### What is a Backend in Next.js + Supabase?

In a Next.js + Supabase project, the "backend" consists of:

1. **Database Layer** (Supabase PostgreSQL)
   - Tables, relationships, indexes
   - Stored functions and triggers
   - Row Level Security (RLS) policies

2. **API Routes** (`app/api/`)
   - REST endpoints for client-server communication
   - Server-side logic that can't run in the browser
   - Integration with third-party services (email, analytics, etc.)

3. **Server Components** (`app/**/page.tsx` with async/await)
   - Direct database queries in React components
   - Server-side rendering with data fetching
   - No client-side JavaScript needed

4. **Server Actions** (Next.js 14+)
   - Form submissions and mutations
   - Direct database operations from forms
   - Type-safe server-side functions

5. **Edge Functions** (`supabase/functions/`)
   - Serverless functions for complex operations
   - Webhooks, cron jobs, background processing
   - Email sending, order processing

6. **Type Definitions** (`lib/types/` or `src/types/`)
   - TypeScript types matching your database schema
   - Shared types between frontend and backend

7. **Service Layer** (`lib/services/`)
   - Reusable business logic
   - Database query abstractions
   - Validation and error handling

8. **Utilities** (`lib/utils/`)
   - Helper functions
   - Formatters, validators
   - Common utilities

---

## 🔍 Current Project Analysis

### ✅ What You Already Have

1. **Basic Supabase Setup** ✅
   - `lib/supabase/client.ts` - Browser client
   - `lib/supabase/server.ts` - Server client
   - Middleware for auth token refresh

2. **Database Schema** ✅
   - Complete schema in `supabase/schema.sql`
   - Tables: users, products, orders, drops, referrals, etc.
   - Basic RLS policies enabled
   - Some database functions (reserve_inventory, release_inventory)

3. **Authentication Flow** ✅
   - Auth callback route (`app/auth/callback/route.ts`)
   - User profile creation on signup
   - Referral code handling

4. **Some API Routes** ✅
   - Checkout route (`app/api/checkout/route.ts`)
   - Admin order routes (`app/api/admin/orders/...`)

5. **Admin Protection** ✅
   - `lib/auth/require-admin.ts` - Admin access control
   - Role-based access checking

6. **Edge Functions** ✅
   - Email notification functions

7. **Migrations** ✅
   - Migration files in `supabase/migrations/`

### ❌ What's Missing

1. **Type Definitions**
   - No TypeScript types for database tables
   - No shared types between components and API routes

2. **Service Layer**
   - No abstraction for database operations
   - Business logic scattered across components
   - No centralized error handling

3. **Complete API Routes**
   - Missing: Products CRUD API
   - Missing: Orders management API
   - Missing: User management API
   - Missing: Cart operations API
   - Missing: Drops management API
   - Missing: Referrals API
   - Missing: File upload API

4. **RLS Policies**
   - Incomplete policies for admin operations
   - Missing policies for some tables
   - No service role bypass functions

5. **Validation & Error Handling**
   - No input validation utilities
   - No standardized error responses
   - No error logging system

6. **Storage Integration**
   - No file upload handling
   - No image optimization pipeline
   - No storage bucket policies

7. **Testing Infrastructure**
   - No API route tests
   - No database function tests

---

## 📁 Recommended Folder Structure

```
Experiment3_k/
├── app/
│   ├── api/                          # API Routes (REST endpoints)
│   │   ├── products/
│   │   │   ├── route.ts              # GET, POST /api/products
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET, PATCH, DELETE /api/products/[id]
│   │   ├── orders/
│   │   │   ├── route.ts             # GET, POST /api/orders
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET, PATCH /api/orders/[id]
│   │   ├── cart/
│   │   │   ├── route.ts             # GET, POST /api/cart
│   │   │   └── [id]/
│   │   │       └── route.ts         # DELETE /api/cart/[id]
│   │   ├── users/
│   │   │   ├── route.ts             # GET, PATCH /api/users
│   │   │   └── profile/
│   │   │       └── route.ts         # GET, PATCH /api/users/profile
│   │   ├── drops/
│   │   │   ├── route.ts             # GET, POST /api/drops
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET, PATCH, DELETE /api/drops/[id]
│   │   ├── referrals/
│   │   │   ├── route.ts             # GET /api/referrals
│   │   │   └── claim/
│   │   │       └── route.ts         # POST /api/referrals/claim
│   │   ├── upload/
│   │   │   └── route.ts             # POST /api/upload (file uploads)
│   │       │   └── route.ts         # ✅ Already exists
│   │           └── route.ts         # ✅ Already exists
│   │
│   ├── (pages)/                      # Your existing pages
│   └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # ✅ Browser client
│   │   └── server.ts                # ✅ Server client
│   │
│   ├── services/                     # 🆕 Business Logic Layer
│   │   ├── products.service.ts      # Product operations
│   │   ├── orders.service.ts        # Order operations
│   │   ├── cart.service.ts          # Cart operations
│   │   ├── users.service.ts         # User operations
│   │   ├── drops.service.ts         # Drop operations
│   │   ├── referrals.service.ts     # Referral operations
│   │   └── storage.service.ts       # File upload operations
│   │
│   ├── types/                        # 🆕 TypeScript Types
│   │   ├── database.types.ts        # Generated from Supabase
│   │   ├── api.types.ts             # API request/response types
│   │   └── index.ts                 # Re-export all types
│   │
│   ├── utils/                        # ✅ Exists, needs expansion
│   │   ├── currency.ts              # ✅ Exists
│   │   ├── validation.ts            # 🆕 Input validation
│   │   ├── errors.ts                # 🆕 Error handling
│   │   └── format.ts                # 🆕 Formatters
│   │
│   └── auth/
│       └── require-admin.ts          # ✅ Exists
│
├── supabase/
│   ├── migrations/                   # ✅ Exists
│   │   └── *.sql                    # Database migrations
│   ├── functions/                    # ✅ Exists
│   │   └── *.ts                     # Edge functions
│   └── schema.sql                    # ✅ Exists
│
└── src/                              # Alternative location (you have both)
    └── types/                         # Can consolidate here
```

---

## 📚 Backend Concepts Explained

### 1. API Routes (`app/api/`)

**What are they?**
- Server-side endpoints that handle HTTP requests (GET, POST, PATCH, DELETE)
- Run only on the server, never in the browser
- Can access environment variables, database, external APIs

**When to use:**
- When you need to perform operations that can't run in the browser
- When you need to keep secrets (API keys, database credentials)
- When you need to integrate with third-party services
- When you need to handle webhooks

**Example:**
```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/products
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// POST /api/products
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('products')
    .insert(body)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
```

---

### 2. Server Components vs Client Components

**Server Components** (Default in Next.js 14)
- Run only on the server
- Can directly query the database
- No JavaScript sent to browser (faster, more secure)
- Can use `async/await` directly

```typescript
// app/products/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*');
  
  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

**Client Components** (Need `'use client'` directive)
- Run in the browser
- Can use React hooks (useState, useEffect)
- Can handle user interactions
- Cannot directly access database (must use API routes)

```typescript
// app/products/page.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const supabase = createClient();
  
  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .then(({ data }) => setProducts(data || []));
  }, []);
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

**When to use which:**
- **Server Component**: Data fetching, static content, SEO-critical pages
- **Client Component**: Interactive UI, forms, real-time updates, user interactions

---

### 3. Row Level Security (RLS)

**What is RLS?**
- Database-level security that controls which rows users can see/modify
- Policies are SQL rules that check user permissions
- Runs automatically on every database query

**How it works:**
```sql
-- Example: Users can only see their own orders
CREATE POLICY "Users can view own orders" 
ON public.orders
FOR SELECT 
USING (auth.uid() = user_id);
```

**Common Policy Patterns:**

1. **Users see only their own data:**
```sql
CREATE POLICY "Users see own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);
```

2. **Public read, authenticated write:**
```sql
CREATE POLICY "Public can read products"
ON public.products FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can modify products"
ON public.products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

3. **Service role bypass (for API routes):**
```sql
-- Sometimes you need to bypass RLS in API routes
-- Use service role client (not anon key) for admin operations
```

---

### 4. Database Functions vs API Routes

**Database Functions** (PostgreSQL functions in Supabase)
- Run inside the database
- Very fast (no network overhead)
- Atomic operations (transactions)
- Can be called from anywhere

**When to use:**
- Complex queries that need to be atomic
- Operations that need database-level guarantees
- Performance-critical operations

**Example:**
```sql
-- supabase/migrations/xxx_reserve_inventory.sql
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE products
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE id = p_product_id
  AND (stock_quantity - reserved_quantity) >= p_quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

**API Routes** (Next.js)
- Run on the server
- Can integrate with external services
- More flexible logic
- Better error handling for clients

**When to use:**
- Operations that need external API calls
- Complex business logic
- File uploads
- Webhooks

---

### 5. Service Layer Pattern

**What is it?**
- Abstraction layer between API routes and database
- Centralizes business logic
- Reusable across components and API routes
- Easier to test and maintain

**Example:**
```typescript
// lib/services/products.service.ts
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/types';

export class ProductsService {
  static async getAll(filters?: {
    category?: string;
    isActive?: boolean;
  }) {
    const supabase = await createClient();
    let query = supabase.from('products').select('*');
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(error.message);
    return data as Product[];
  }
  
  static async getById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data as Product;
  }
  
  static async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as Product;
  }
}
```

---

### 6. Authentication Flow with Supabase

**How it works:**

1. **User signs up/logs in:**
   ```typescript
   // Client-side
   const supabase = createClient();
   await supabase.auth.signInWithOtp({ email });
   ```

2. **User clicks magic link:**
   - Supabase redirects to `/auth/callback?code=xxx`

3. **Callback route exchanges code:**
   ```typescript
   // app/auth/callback/route.ts
   const { data } = await supabase.auth.exchangeCodeForSession(code);
   ```

4. **Session stored in cookies:**
   - Middleware refreshes token automatically
   - Server components can access user via `supabase.auth.getUser()`

5. **RLS policies check user:**
   - `auth.uid()` returns current user ID
   - Policies use this to filter data

---

### 7. File Storage in Supabase

**Storage Buckets:**
- Create buckets in Supabase dashboard
- Set policies for who can upload/download
- Use Supabase Storage API

**Example:**
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`${productId}/${filename}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(`${productId}/${filename}`);
```

---

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. ✅ Set up TypeScript types from database
2. ✅ Create service layer structure
3. ✅ Set up error handling utilities
4. ✅ Create validation utilities

### Phase 2: Core APIs (Week 2-3)
1. ✅ Products API (CRUD)
2. ✅ Orders API (CRUD)
3. ✅ Cart API
4. ✅ Users API

### Phase 3: Advanced Features (Week 4)
1. ✅ Drops API
2. ✅ Referrals API
3. ✅ File upload API
4. ✅ Complete RLS policies

### Phase 4: Optimization (Week 5)
1. ✅ Add caching
2. ✅ Add rate limiting
3. ✅ Add logging
4. ✅ Add monitoring

---

## 🚀 Step-by-Step Implementation Guide

### Step 1: Generate TypeScript Types

**Why:** Type safety prevents bugs and improves DX

**How:**
1. Install Supabase CLI: `npm install -g supabase`
2. Generate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.types.ts`

**Or manually create:**
```typescript
// lib/types/database.types.ts
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          // ... other fields
        };
        Insert: {
          id: string;
          email: string;
          // ... other fields
        };
        Update: {
          email?: string;
          // ... other fields
        };
      };
      // ... other tables
    };
  };
};
```

---

### Step 2: Create Service Layer

**Why:** Centralize business logic, make it reusable

**Start with:** `lib/services/products.service.ts`

---

### Step 3: Create API Routes

**Start with:** `app/api/products/route.ts`

**Pattern:**
1. Validate input
2. Check authentication/authorization
3. Call service layer
4. Return response

---

### Step 4: Complete RLS Policies

**Why:** Security at database level

**Check:** Each table has appropriate policies

---

### Step 5: Add File Upload

**Why:** Product images, user avatars

**Create:** `app/api/upload/route.ts`

---

## ❓ Questions for You

Before I generate code, I need to know:

1. **What features are most critical right now?**
   - Products management?
   - Orders processing?
   - Cart functionality?

2. **Do you have Supabase project set up?**
   - Project URL?
   - Service role key? (for admin operations)

3. **What's your priority?**
   - Get basic CRUD working?
   - Complete the entire backend?
   - Focus on specific features?

---

## 🎯 Next Steps

**Tell me which of these you want me to implement first:**

1. **Type Definitions** - Generate TypeScript types from your schema
2. **Products Service & API** - Complete CRUD for products
3. **Orders Service & API** - Order management
4. **Cart Service & API** - Shopping cart operations
5. **File Upload API** - Image uploads to Supabase Storage
6. **Complete RLS Policies** - Security policies for all tables
7. **Error Handling System** - Standardized error responses
8. **Validation Utilities** - Input validation helpers

**Or say "implement all" and I'll create everything step by step!**

---

## 📖 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**Ready to start? Tell me what you want to build first! 🚀**

