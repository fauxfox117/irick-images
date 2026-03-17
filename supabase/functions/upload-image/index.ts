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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for storage operations
    )

    const { base64Image, fileName, category } = await req.json()

    if (!base64Image || !fileName || !category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decode base64 to binary
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    const filePath = `${category}/${fileName}`

    const { data, error } = await supabaseClient.storage
      .from('images')
      .upload(filePath, binaryData, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabaseClient.storage
      .from('images')
      .getPublicUrl(filePath)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Image uploaded successfully',
        path: data.path,
        url: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Upload image error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
