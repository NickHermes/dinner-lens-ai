import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Test OpenAI - Starting...')
    
    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Test OpenAI - API key found, making test call...')

    // Test with a simple text completion first
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Return a JSON object with: {"test": "success", "message": "OpenAI API is working"}'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    })

    console.log('Test OpenAI - Response status:', testResponse.status)

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Test OpenAI - Error response:', errorText)
      throw new Error(`OpenAI API error: ${testResponse.status} - ${errorText}`)
    }

    const result = await testResponse.json()
    console.log('Test OpenAI - Success response:', result)

    return new Response(JSON.stringify({
      message: 'OpenAI API test successful!',
      result: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Test OpenAI Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
