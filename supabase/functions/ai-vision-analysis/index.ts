import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  imageUrl: string
  dinnerId: string
}

interface AITag {
  name: string
  type: 'ingredient' | 'cuisine' | 'dish' | 'diet' | 'method' | 'course'
}

interface AnalysisResponse {
  suggested_title: string
  suggested_caption: string
  suggested_tags: AITag[]
  health_score: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, dinnerId }: AnalysisRequest = await req.json()
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'imageUrl is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Quick reachability check to surface clearer errors
    try {
      const head = await fetch(imageUrl, { method: 'HEAD' })
      if (!head.ok) {
        return new Response(JSON.stringify({ error: `Image not reachable: ${head.status}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: `Failed to fetch image URL: ${(e as Error).message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Analyze image with OpenAI Vision
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
                text: `Analyze this dinner photo and return ONLY a valid JSON object with this exact structure:
                {
                  "suggested_title": "Short dish name",
                  "suggested_caption": "One-line description",
                  "suggested_tags": [
                    {"name": "main ingredient", "type": "ingredient"},
                    {"name": "cuisine type", "type": "cuisine"},
                    {"name": "dish type", "type": "dish"}
                  ],
                  "health_score": 75
                }

                Provide 2-8 tags focusing on:
                - Main visible ingredients (rice, chicken, vegetables, etc.)
                - Cuisine type (Italian, Japanese, Mexican, etc.) 
                - Dish type (burger, pasta, salad, etc.)
                - Only include diet tags if obviously vegetarian/vegan/pescetarian
                
                For health_score, rate from 0-100 based on: vegetables (+10), whole grains (+6), fish (+6), deep-fried (-10), red meat (-8), sugary desserts (-8).
                Return ONLY the JSON, no other text.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })

    const visionResult = await visionResponse.json()
    
    if (!visionResponse.ok) {
      throw new Error(`OpenAI API error: ${visionResponse.status} - ${JSON.stringify(visionResult)}`)
    }
    
    const analysisText = visionResult.choices?.[0]?.message?.content

    if (!analysisText) {
      console.error('Vision result:', visionResult)
      throw new Error('No analysis returned from AI')
    }

    // Parse AI response
    let analysis: AnalysisResponse
    try {
      // Try to extract JSON from the response if it's wrapped in markdown
      let jsonText = analysisText
      if (analysisText.includes('```json')) {
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          jsonText = jsonMatch[1]
        }
      }
      
      analysis = JSON.parse(jsonText)
      
      // Validate the response structure
      if (!analysis.suggested_title) analysis.suggested_title = 'Delicious Dinner'
      if (!analysis.suggested_caption) analysis.suggested_caption = 'A tasty meal captured'
      if (!analysis.suggested_tags) analysis.suggested_tags = []
      if (!analysis.health_score) analysis.health_score = 50
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw AI Response:', analysisText)
      
      // Fallback parsing if JSON is malformed
      analysis = {
        suggested_title: 'Delicious Dinner',
        suggested_caption: 'A tasty meal captured',
        suggested_tags: [],
        health_score: 50
      }
    }

    // Just return the analysis for now - the client will handle saving

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI Vision Analysis Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})