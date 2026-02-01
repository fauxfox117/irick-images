import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe (optional - only if key exists)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Initialize Supabase with api schema
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    db: {
      schema: "api",
    },
  },
);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Create payment intent endpoint (ported from irickimages_full)
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        error:
          "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.",
      });
    }

    const { amount, bookingData, totalPrice } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        customer_email: bookingData.customerInfo.email,
        customer_name: bookingData.customerInfo.name,
        package_name: bookingData.package.name,
        total_price: totalPrice.toString(),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Booking complete endpoint (ported from irickimages_full)
app.post("/api/booking-complete", async (req, res) => {
  try {
    const { bookingData, paymentIntentId, totalPrice, depositPaid } = req.body;

    // Store booking in Supabase
    const { data, error } = await supabase
      .from("bookings")
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
      message: "Booking saved successfully",
      bookingId: data[0].id,
    });
  } catch (error) {
    console.error("Booking complete error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
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
      session: data.session,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message });
  }
});

// Get all bookings (admin only)
app.get("/api/admin/bookings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ bookings: data });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Upload image endpoint
app.post("/api/admin/upload-image", async (req, res) => {
  try {
    const { fileName, fileData, category } = req.body;

    // Remove data URL prefix (data:image/jpeg;base64,) and decode base64
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Upload to Supabase storage (upsert to overwrite if exists)
    const { data, error } = await supabase.storage
      .from("images")
      .upload(`${category}/${fileName}`, buffer, {
        contentType: "image/jpeg", // or detect from original data URL
        upsert: true,
      });

    if (error) throw error;

    res.json({
      success: true,
      path: data.path,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get images from a category endpoint
app.get("/api/images/:category", async (req, res) => {
  try {
    const { category } = req.params;

    // List all files in the category folder
    const { data: files, error } = await supabase.storage
      .from("images")
      .list(category, {
        sortBy: { column: "name", order: "asc" },
      });

    if (error) throw error;

    // Get public URLs for all images
    const imagesWithUrls = files
      .filter((file) => file.name !== ".emptyFolderPlaceholder")
      .map((file) => {
        const { data } = supabase.storage
          .from("images")
          .getPublicUrl(`${category}/${file.name}`);

        return {
          name: file.name,
          url: data.publicUrl,
          created_at: file.created_at,
        };
      });

    res.json({ images: imagesWithUrls });
  } catch (error) {
    console.error("Get images error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all photos from storage
app.get("/api/admin/photos", async (req, res) => {
  try {
    const { category } = req.query;

    if (category) {
      // Get photos from specific category
      const { data: files, error } = await supabase.storage
        .from("images")
        .list(category);

      if (error) throw error;

      const photos = files
        .filter((file) => file.name !== ".emptyFolderPlaceholder")
        .map((file) => {
          const { data } = supabase.storage
            .from("images")
            .getPublicUrl(`${category}/${file.name}`);

          return {
            name: file.name,
            path: `${category}/${file.name}`,
            category,
            url: data.publicUrl,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
          };
        });

      res.json({ photos });
    } else {
      // Get photos from all categories
      const categories = [
        "real-estate",
        "portraits",
        "performance",
        "events-misc",
        "promotional",
      ];
      const allPhotos = [];

      for (const cat of categories) {
        const { data: files } = await supabase.storage.from("images").list(cat);

        if (files) {
          files
            .filter((file) => file.name !== ".emptyFolderPlaceholder")
            .forEach((file) => {
              const { data } = supabase.storage
                .from("images")
                .getPublicUrl(`${cat}/${file.name}`);

              allPhotos.push({
                name: file.name,
                path: `${cat}/${file.name}`,
                category: cat,
                url: data.publicUrl,
                size: file.metadata?.size || 0,
                created_at: file.created_at,
              });
            });
        }
      }

      res.json({ photos: allPhotos });
    }
  } catch (error) {
    console.error("Get photos error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete photo from storage
app.delete("/api/admin/photos", async (req, res) => {
  try {
    const { path } = req.body;

    const { error } = await supabase.storage.from("images").remove([path]);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Move photo to different category
app.post("/api/admin/photos/move", async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;

    // Download the file from old location
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("images")
      .download(oldPath);

    if (downloadError) throw downloadError;

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Upload to new location
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(newPath, buffer, {
        contentType: fileData.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Delete old file
    const { error: deleteError } = await supabase.storage
      .from("images")
      .remove([oldPath]);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (error) {
    console.error("Move photo error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm booking
app.patch("/api/admin/bookings/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;

    // Update booking status (you may need to add a status column to your database)
    const { data, error } = await supabase
      .from("bookings")
      .update({ confirmed: true, updated_at: new Date() })
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Confirm booking error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete booking
app.delete("/api/admin/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Frontend URL: ${process.env.FRONTEND_URL}`);
});
