-- Create api schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS api;

-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO authenticated;

-- Create bookings table in the api schema
CREATE TABLE IF NOT EXISTS api.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  location TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_price DECIMAL(10, 2) NOT NULL,
  add_ons JSONB DEFAULT '[]'::jsonb,
  total_price DECIMAL(10, 2) NOT NULL,
  deposit_paid DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_email ON api.bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON api.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON api.bookings(created_at DESC);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON api.bookings TO anon;
GRANT ALL ON api.bookings TO authenticated;

-- Create storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Allow public updates" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'images');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'images');

-- Enable Row Level Security
ALTER TABLE api.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public booking inserts" ON api.bookings;
DROP POLICY IF EXISTS "Allow read bookings" ON api.bookings;
DROP POLICY IF EXISTS "Allow update bookings" ON api.bookings;
DROP POLICY IF EXISTS "Allow delete bookings" ON api.bookings;

-- Policy: Allow insert for anyone (for booking submissions)
CREATE POLICY "Allow public booking inserts" ON api.bookings
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow read for anyone (backend endpoint handles auth)
CREATE POLICY "Allow read bookings" ON api.bookings
  FOR SELECT
  USING (true);

-- Policy: Allow update for anyone (backend endpoint handles auth)
CREATE POLICY "Allow update bookings" ON api.bookings
  FOR UPDATE
  USING (true);

-- Policy: Allow delete for anyone (backend endpoint handles auth)
CREATE POLICY "Allow delete bookings" ON api.bookings
  FOR DELETE
  USING (true);
