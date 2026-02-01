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

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const bookingId = pathParts[pathParts.length - 1]
    const action = pathParts[pathParts.length - 2] // 'confirm' or just the id for delete

    // PATCH /update-booking/{id}/confirm - Confirm booking
    if (req.method === 'PATCH' && action === 'confirm') {
      const { data, error } = await supabaseClient
        .from('bookings')
        .update({ 
          confirmed: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, booking: data[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /update-booking/{id} - Delete booking
    if (req.method === 'DELETE') {
      const { error } = await supabaseClient
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Booking deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update booking error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-booking' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODUyNjI3MDl9.OfWqxjvjeRKLBovB0ac63y3Md_fGbPg7JJfGb79cVrjyG9wRRn5XYsV2Uq2YNme8PcNtnQ42E909nEWIbyG_SQ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
