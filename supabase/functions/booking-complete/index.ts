import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { db: { schema: 'api' } }
    )

    const { bookingData, paymentIntentId, totalPrice, depositPaid } = await req.json()

    const { data, error } = await supabaseClient
      .from('bookings')
      .insert([{
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
      }])
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking saved successfully',
        bookingId: data[0].id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Booking complete error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/booking-complete' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODUyNjIzODV9.vBvQRSa5NDZUrfOublvwVZ0LRhcObgdCKZgIxHWfi9hGEtsJPtGxhVZdvD5pDSnnesqqfsAz_J8SloksnOZ95w' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
