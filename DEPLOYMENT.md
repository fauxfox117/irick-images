# Edge Functions Deployment Guide

## Step 1: Set Environment Variables in Supabase

Go to your Supabase Dashboard → Settings → Edge Functions → Add secrets:

```
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

**Note:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase Edge Functions - you don't need to set them manually.

**IMPORTANT:** You'll also need to add your `SUPABASE_SERVICE_ROLE_KEY` (found in Settings → API) for storage operations.

## Step 2: Deploy Functions via Supabase Dashboard

Since CLI deployment requires organization permissions, deploy through the dashboard:

### Option A: Via Dashboard UI

1. Go to **Edge Functions** in left sidebar
2. Click **New Function**
3. Name it exactly as shown below
4. Copy the code from the corresponding file in `supabase/functions/`
5. Click **Deploy**

### Option B: Via CLI (if permissions are granted)

```bash
cd negative-films
supabase functions deploy create-payment-intent --project-ref khugldubsnfehbnibabj
supabase functions deploy booking-complete --project-ref khugldubsnfehbnibabj
supabase functions deploy admin-bookings --project-ref khugldubsnfehbnibabj
supabase functions deploy upload-image --project-ref khugldubsnfehbnibabj
supabase functions deploy get-images --project-ref khugldubsnfehbnibabj
supabase functions deploy manage-photos --project-ref khugldubsnfehbnibabj
supabase functions deploy update-booking --project-ref khugldubsnfehbnibabj
```

## Step 3: Functions to Deploy

### 1. create-payment-intent

**File:** `supabase/functions/create-payment-intent/index.ts`
**URL:** `https://khugldubsnfehbnibabj.supabase.co/functions/v1/create-payment-intent`
**Method:** POST
**Body:** `{ amount, customerInfo, packageName }`

### 2. booking-complete

**File:** `supabase/functions/booking-complete/index.ts`
**URL:** `https://khugldubsnfehbnibabj.supabase.co/functions/v1/booking-complete`
**Method:** POST
**Body:** `{ bookingData, paymentIntentId, totalPrice, depositPaid }`

### 3. admin-bookings

**File:** `supabase/functions/admin-bookings/index.ts`
**URL:** `https://khugldubsnfehbnibabj.supabase.co/functions/v1/admin-bookings`
**Method:** GET
**Query params:** `?status=all&startDate=&endDate=`

### 4. upload-image

**File:** `supabase/functions/upload-image/index.ts`
**URL:** `https://khugldubsnfehbnibabj.supabase.co/functions/v1/upload-image`
**Method:** POST
**Body:** `{ base64Image, fileName, category }`

### 5. get-images

**File:** `supabase/functions/get-images/index.ts`
**URL:** `https://khugldubsnfehbnibabj.supabase.co/functions/v1/get-images`
**Method:** GET
**Query params:** `?category=all`

### 6. manage-photos

**File:** `supabase/functions/manage-photos/index.ts`
**URL:** `https://khugldubsnfehbnibabj.supabase.co/functions/v1/manage-photos`
**Methods:** DELETE (to delete), POST (to move)
**Body:** `{ path }` or `{ oldPath, newCategory }`

### 7. update-booking

**File:** `supabase/functions/update-booking/index.ts`
**URL:** `https://khugldubsnfehbnibabj.supabase.co/functions/v1/update-booking/{id}/confirm` (PATCH) or `https://khugldubsnfehbnibabj.supabase.co/functions/v1/update-booking/{id}` (DELETE)
**Methods:** PATCH (to confirm), DELETE (to delete)
**Body:** None required

## Step 4: Update Frontend API URLs

After deploying, update these files:

### scripts/booking.js

Change line 14:

```javascript
const API_URL = "https://khugldubsnfehbnibabj.supabase.co/functions/v1";
```

### scripts/admin-dashboard.js

Update API calls to use Edge Function URLs

## Step 5: Test Each Function

Use the Supabase Dashboard → Edge Functions → Select function → Invoke to test each function with sample payloads.

## Troubleshooting

**403 Forbidden:** Check that environment secrets are set correctly
**CORS errors:** All functions include CORS headers, ensure they're deployed correctly
**Storage errors:** Verify SERVICE_ROLE_KEY is set for upload-image and manage-photos

## Cost

✅ **100% FREE** - All Edge Functions run within Supabase free tier (500K function invocations/month)
