# ✅ Edge Functions Migration Complete

All Express.js server endpoints have been converted to Supabase Edge Functions!

## 📦 What Was Converted

Your Express server (`server.js`) has been replaced with **7 serverless Edge Functions**:

| Express Endpoint                        | Edge Function           | Status       |
| --------------------------------------- | ----------------------- | ------------ |
| `POST /api/create-payment-intent`       | `create-payment-intent` | ✅ Converted |
| `POST /api/booking-complete`            | `booking-complete`      | ✅ Converted |
| `GET /api/admin/bookings`               | `admin-bookings`        | ✅ Converted |
| `POST /api/admin/upload-image`          | `upload-image`          | ✅ Converted |
| `GET /api/admin/photos`                 | `get-images`            | ✅ Converted |
| `DELETE /api/admin/photos`              | `manage-photos`         | ✅ Converted |
| `POST /api/admin/photos/move`           | `manage-photos`         | ✅ Converted |
| `PATCH /api/admin/bookings/:id/confirm` | `update-booking`        | ✅ Converted |
| `DELETE /api/admin/bookings/:id`        | `update-booking`        | ✅ Converted |

## 🎯 Frontend Updates

Both frontend files have been updated to use Edge Function URLs:

- ✅ [scripts/booking.js](scripts/booking.js) → API_URL changed to `https://khugldubsnfehbnibabj.supabase.co/functions/v1`
- ✅ [scripts/admin-dashboard.js](scripts/admin-dashboard.js) → All 6 API calls updated to new endpoints

## 🗄️ Database Updates Needed

Run this SQL in your Supabase SQL Editor to add the `confirmed` column:

```sql
ALTER TABLE api.bookings
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;
```

Or use the included file: [add-confirmed-column.sql](add-confirmed-column.sql)

## 🚀 Next Steps: Deploy to Supabase

Since CLI deployment requires organization permissions, you'll need to deploy via the **Supabase Dashboard**:

### Step 1: Set Environment Secrets

Go to: **Supabase Dashboard** → **Edge Functions** → **Manage Secrets**

Add these secrets:

```
STRIPE_SECRET_KEY=sk_test_51QgjWlKu5YmxIk0YrpWqDG1YxJCU2k8IB3P1jJBQVBjzzLLaUKGoxWIu4jKc9Pg8b1D01z1uaOUCFPZLGmfxiykk001wvD8I76
SUPABASE_URL=https://khugldubsnfehbnibabj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=[Get from Settings → API]
```

### Step 2: Deploy Each Function

For each function below, go to **Edge Functions** → **New Function** → paste the code → **Deploy**

#### 1. create-payment-intent

📁 Copy from: `supabase/functions/create-payment-intent/index.ts`

#### 2. booking-complete

📁 Copy from: `supabase/functions/booking-complete/index.ts`

#### 3. admin-bookings

📁 Copy from: `supabase/functions/admin-bookings/index.ts`

#### 4. upload-image

📁 Copy from: `supabase/functions/upload-image/index.ts`

#### 5. get-images

📁 Copy from: `supabase/functions/get-images/index.ts`

#### 6. manage-photos

📁 Copy from: `supabase/functions/manage-photos/index.ts`

#### 7. update-booking

📁 Copy from: `supabase/functions/update-booking/index.ts`

### Step 3: Test Your Functions

After deploying, test in the Supabase Dashboard:

1. Go to **Edge Functions**
2. Click on each function
3. Use the **Invoke** tab to test with sample data

### Step 4: Deploy Frontend to Vercel

Your frontend is already configured! Just push to Vercel:

```bash
cd negative-films
git add .
git commit -m "Migrate to Supabase Edge Functions"
git push
```

## 💰 Cost Breakdown

| Service                       | Usage                  | Cost                  |
| ----------------------------- | ---------------------- | --------------------- |
| Supabase (Database + Storage) | Free tier              | **$0/month**          |
| Supabase Edge Functions       | 500K invocations/month | **$0/month**          |
| Vercel (Frontend hosting)     | 100GB bandwidth        | **$0/month**          |
| Stripe (Payment processing)   | Pay as you go          | Transaction fees only |
| **Total monthly cost**        |                        | **$0** ✅             |

## 🎉 Benefits

✅ **No more $5/month Railway cost**  
✅ **100% free within Supabase limits**  
✅ **Serverless - auto-scales**  
✅ **No server to maintain**  
✅ **Deployed to global edge network**  
✅ **Faster response times**

## 📝 Files Changed

### New Files Created

- `supabase/functions/create-payment-intent/index.ts`
- `supabase/functions/booking-complete/index.ts`
- `supabase/functions/admin-bookings/index.ts`
- `supabase/functions/upload-image/index.ts`
- `supabase/functions/get-images/index.ts`
- `supabase/functions/manage-photos/index.ts`
- `supabase/functions/update-booking/index.ts`
- `DEPLOYMENT.md` (deployment guide)
- `add-confirmed-column.sql` (database migration)

### Files Modified

- `scripts/booking.js` (API URL updated)
- `scripts/admin-dashboard.js` (All 6 API endpoints updated)
- `supabase-schema-api.sql` (Added `confirmed` column)

### Files No Longer Needed (After Deployment)

- ⚠️ `server.js` (can be archived after Edge Functions are deployed and tested)
- ⚠️ `.env` (Stripe key now in Supabase secrets)

## 🧪 Testing Checklist

Before going live, test these workflows:

- [ ] Book a session with credit card payment
- [ ] View booking in admin dashboard
- [ ] Upload a photo to each category
- [ ] View photos in photo manager
- [ ] Move a photo between categories
- [ ] Delete a photo
- [ ] Confirm a booking
- [ ] Delete a booking

## 🆘 Troubleshooting

**Function returns 403 Forbidden**

- Check that environment secrets are set correctly
- Verify SUPABASE_SERVICE_ROLE_KEY is set for storage functions

**CORS errors**

- All functions include proper CORS headers
- Make sure the function code wasn't modified during copy/paste

**Images not loading**

- Verify storage bucket is public
- Check RLS policies in Supabase Dashboard → Storage

**Payment not working**

- Confirm STRIPE_SECRET_KEY is set in Supabase secrets
- Test with card: `4242 4242 4242 4242`, expiry: any future date

---

Need help? Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions!
