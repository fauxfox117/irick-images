import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { package: pkg, addOns, customerInfo } = await req.json();

    if (
      !customerInfo?.name ||
      !customerInfo?.email ||
      !customerInfo?.phone ||
      !customerInfo?.date ||
      !customerInfo?.location
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const packagePrice = pkg?.price || 0;
    const addOnsPrice = (addOns || []).reduce(
      (sum, a) => sum + (a.price || 0),
      0,
    );
    const totalPrice = packagePrice + addOnsPrice;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const addOnsList =
      (addOns || []).map((a) => `${a.name} — $${a.price}`).join("<br>") ||
      "None";

    // Email to photographer
    await transporter.sendMail({
      from: `"Irick Images Booking" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `New Booking Request — ${customerInfo.name}`,
      html: `
        <h2>New Booking Request</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;">
          <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${customerInfo.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;"><a href="mailto:${customerInfo.email}">${customerInfo.email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;"><a href="tel:${customerInfo.phone}">${customerInfo.phone}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Shoot Date</td><td style="padding:8px;">${customerInfo.date}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Time</td><td style="padding:8px;">${customerInfo.time || "Not specified"}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Location</td><td style="padding:8px;">${customerInfo.location}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Package</td><td style="padding:8px;">${pkg?.name || "None"} — $${pkg?.price || 0}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Add-ons</td><td style="padding:8px;">${addOnsList}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Total</td><td style="padding:8px;"><strong>$${totalPrice}</strong></td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Notes</td><td style="padding:8px;">${customerInfo.notes || "None"}</td></tr>
        </table>
      `,
    });

    // Store in Supabase if configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { db: { schema: "api" } },
      );

      await supabase.from("bookings").insert([
        {
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          booking_date: customerInfo.date,
          booking_time: customerInfo.time || null,
          location: customerInfo.location,
          package_name: pkg?.name || null,
          package_price: pkg?.price || 0,
          add_ons: JSON.stringify(addOns || []),
          total_price: totalPrice,
          deposit_paid: 0,
          payment_intent_id: "email-booking",
          notes: customerInfo.notes || "",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-booking error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send booking request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const config = {
  path: "/api/send-booking",
};
