import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

    if (req.method === 'DELETE') {
      const { path } = await req.json()

      const { error } = await supabaseClient.storage
        .from('images')
        .remove([path])

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Photo deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { oldPath, newCategory } = await req.json()

      if (!oldPath || !newCategory) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Download the file
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('images')
        .download(oldPath)

      if (downloadError) throw downloadError

      // Get file name from old path
      const fileName = oldPath.split('/').pop()
      const newPath = `${newCategory}/${fileName}`

      // Upload to new location
      const { error: uploadError } = await supabaseClient.storage
        .from('images')
        .upload(newPath, fileData, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Delete old file
      const { error: deleteError } = await supabaseClient.storage
        .from('images')
        .remove([oldPath])

      if (deleteError) throw deleteError

      const { data: { publicUrl } } = supabaseClient.storage
        .from('images')
        .getPublicUrl(newPath)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Photo moved successfully',
          newPath,
          url: publicUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Manage photos error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
