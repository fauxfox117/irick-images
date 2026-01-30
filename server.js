import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Create payment intent endpoint (ported from irickimages_full)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, bookingData, totalPrice } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingData: JSON.stringify(bookingData),
        totalPrice: totalPrice.toString(),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Booking complete endpoint (ported from irickimages_full)
app.post('/api/booking-complete', async (req, res) => {
  try {
    const { bookingData, paymentIntentId, totalPrice, depositPaid } = req.body;

    // Store booking in Supabase
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          customer_name: bookingData.customerInfo.name,
          customer_email: bookingData.customerInfo.email,
          customer_phone: bookingData.customerInfo.phone,
          booking_date: bookingData.customerInfo.date,
          booking_time: bookingData.customerInfo.time,
          location: bookingData.customerInfo.location,
          package_name: bookingData.package.name,
          package_price: bookingData.package.price,
          add_ons: JSON.stringify(bookingData.addOns),
          total_price: totalPrice,
          deposit_paid: depositPaid,
          payment_intent_id: paymentIntentId,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Booking saved successfully',
      bookingId: data[0].id 
    });
  } catch (error) {
    console.error('Booking complete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.json({ 
      success: true, 
      user: data.user,
      session: data.session 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get all bookings (admin only)
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ bookings: data });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload image endpoint
app.post('/api/admin/upload-image', async (req, res) => {
  try {
    const { fileName, fileData, category } = req.body;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`${category}/${fileName}`, fileData);

    if (error) throw error;

    res.json({ 
      success: true, 
      path: data.path 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Frontend URL: ${process.env.FRONTEND_URL}`);
});
