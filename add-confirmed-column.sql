-- Add confirmed column to existing bookings table
ALTER TABLE api.bookings 
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;
