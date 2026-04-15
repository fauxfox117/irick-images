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
    )

    const url = new URL(req.url)
    const category = url.searchParams.get('category')

    if (!category || category === 'all') {
      // Get all images from all categories
      const categories = ['real-estate', 'portraits', 'performance', 'events-misc', 'promotional']
      let allImages = []

      for (const cat of categories) {
        const { data, error } = await supabaseClient.storage
          .from('images')
          .list(cat, {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (error) continue // Skip categories that don't exist

        const imagesInCategory = data
          .filter(file => file.name !== '.emptyFolderPlaceholder' && file.id) // Filter out folders (folders don't have id)
          .map(file => {
            const filePath = `${cat}/${file.name}`
            const { data: { publicUrl } } = supabaseClient.storage
              .from('images')
              .getPublicUrl(filePath)
            
            return {
              name: file.name,
              path: filePath,
              url: publicUrl,
              category: cat,
              size: file.metadata?.size || 0,
              created_at: file.created_at
            }
          })

        allImages = allImages.concat(imagesInCategory)
      }

      // Sort all images by created_at
      allImages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      const imagesWithUrls = allImages

      return new Response(
        JSON.stringify({ success: true, images: imagesWithUrls }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Get images from specific category
      const { data, error } = await supabaseClient.storage
        .from('images')
        .list(category, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      const imagesWithUrls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder' && file.id) // Filter out folders
        .map(file => {
          const filePath = `${category}/${file.name}`
          const { data: { publicUrl } } = supabaseClient.storage
            .from('images')
            .getPublicUrl(filePath)
          
          return {
            name: file.name,
            path: filePath,
            url: publicUrl,
            category: category,
            size: file.metadata?.size || 0,
            created_at: file.created_at
          }
        })

      return new Response(
        JSON.stringify({ success: true, images: imagesWithUrls }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Get images error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
