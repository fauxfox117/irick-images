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

-- Create storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE api.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for anyone (for booking submissions)
CREATE POLICY "Allow public booking inserts" ON api.bookings
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow admin to read all bookings
CREATE POLICY "Allow admin to read bookings" ON api.bookings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Allow admin to update/delete bookings
CREATE POLICY "Allow admin to update bookings" ON api.bookings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to delete bookings" ON api.bookings
  FOR DELETE
  USING (auth.role() = 'authenticated');
