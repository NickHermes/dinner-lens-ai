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
    const { imageUrl, userId } = await req.json()
    
    console.log('Test AI Vision - Request received:', { imageUrl, userId })
    
    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Test AI Vision - OpenAI key found, making API call...')

    // Test with a simple analysis
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: [
              {
                type: 'text',
                text: 'Analyze this image and return a JSON response with: {"suggested_title": "Test Title", "suggested_caption": "Test caption", "suggested_tags": [{"name": "test", "type": "ingredient", "confidence": 0.8}], "nutrition": {}, "health_score": 75}'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      })
    })

    console.log('Test AI Vision - API response status:', visionResponse.status)

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text()
      throw new Error(`OpenAI API error: ${visionResponse.status} - ${errorText}`)
    }

    const visionResult = await visionResponse.json()
    console.log('Test AI Vision - API response:', visionResult)

    const analysisText = visionResult.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis returned from AI')
    }

    console.log('Test AI Vision - Analysis text:', analysisText)

    // Parse AI response
    let analysis
    try {
      analysis = JSON.parse(analysisText)
    } catch {
      analysis = {
        suggested_title: 'Test Dinner',
        suggested_caption: 'A test meal',
        suggested_tags: [{ name: 'test', type: 'ingredient', confidence: 0.8 }],
        nutrition: {},
        health_score: 75
      }
    }

    console.log('Test AI Vision - Final analysis:', analysis)

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Test AI Vision Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
