import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const paypalBaseUrl = (Deno.env.get('PAYPAL_ENV') ?? 'sandbox') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function readJsonSafely(response: Response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

async function getPayPalAccessToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.')
  }

  const auth = btoa(`${clientId}:${clientSecret}`)
  const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const tokenData = await readJsonSafely(tokenResponse)
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to authenticate with PayPal.')
  }

  return tokenData.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, bookingData } = await req.json()
    const amountNumber = Number(amount)

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const purchaseUnit: Record<string, unknown> = {
      amount: {
        currency_code: 'USD',
        value: amountNumber.toFixed(2),
      },
      description: bookingData?.package?.name
        ? `Deposit for ${bookingData.package.name}`
        : 'Booking deposit',
    }

    if (bookingData?.customerInfo?.email) {
      purchaseUnit.custom_id = bookingData.customerInfo.email
    }

    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [purchaseUnit],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    })

    const orderData = await readJsonSafely(orderResponse)
    if (!orderResponse.ok || !orderData.id) {
      throw new Error(orderData.message || 'Failed to create PayPal order.')
    }

    return new Response(JSON.stringify({ orderID: orderData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('PayPal order creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
