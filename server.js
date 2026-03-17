import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

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

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const tokenData = await readJsonSafely(tokenResponse);
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description ||
        tokenData.error ||
        "Failed to authenticate with PayPal.",
    );
  }

  return tokenData.access_token;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Create PayPal order endpoint
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, bookingData } = req.body;
    const amountNumber = Number(amount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ error: "Invalid amount." });
    }

    const accessToken = await getPayPalAccessToken();
    const purchaseUnit = {
      amount: {
        currency_code: "USD",
        value: amountNumber.toFixed(2),
      },
      description: bookingData?.package?.name
        ? `Deposit for ${bookingData.package.name}`
        : "Booking deposit",
    };

    if (bookingData?.customerInfo?.email) {
      purchaseUnit.custom_id = bookingData.customerInfo.email;
    }

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [purchaseUnit],
        application_context: {
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      }),
    });

    const orderData = await readJsonSafely(orderResponse);
    if (!orderResponse.ok || !orderData.id) {
      throw new Error(orderData.message || "Failed to create PayPal order.");
    }

    res.json({ orderID: orderData.id });
  } catch (error) {
    console.error("PayPal order creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Capture PayPal order endpoint
app.post("/api/capture-paypal-order", async (req, res) => {
  try {
    const { orderID } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: "orderID is required." });
    }

    const accessToken = await getPayPalAccessToken();
    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const captureData = await readJsonSafely(captureResponse);
    if (!captureResponse.ok) {
      throw new Error(captureData.message || "Failed to capture PayPal order.");
    }

    const captureID =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
    const status =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.status ||
      captureData?.status;

    if (status !== "COMPLETED") {
      return res.status(400).json({
        error: "PayPal payment is not completed.",
        status,
      });
    }

    res.json({
      orderID: captureData.id || orderID,
      captureID,
      status,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
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
