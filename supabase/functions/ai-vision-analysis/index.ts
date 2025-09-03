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
  confidence: number
}

interface AnalysisResponse {
  title: string
  caption: string
  tags: AITag[]
  nutrition: {
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    fiber_g?: number
  }
  health_score: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, dinnerId }: AnalysisRequest = await req.json()
    
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
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this dinner photo and return a JSON response with:
                1. title: Short dish name (e.g., "Salmon Teriyaki Bowl")
                2. caption: One-line description
                3. tags: Array of objects with name, type (ingredient/cuisine/dish/diet/method/course), and confidence (0-1)
                4. nutrition: Estimated calories, protein_g, carbs_g, fat_g, fiber_g
                5. health_score: 0-100 based on nutritional value

                Focus on visible ingredients and clear dietary indicators. Only include diet tags if obviously vegetarian/vegan/pescetarian.`
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
    const analysisText = visionResult.choices[0]?.message?.content

    if (!analysisText) {
      throw new Error('No analysis returned from AI')
    }

    // Parse AI response
    let analysis: AnalysisResponse
    try {
      analysis = JSON.parse(analysisText)
    } catch {
      // Fallback parsing if JSON is malformed
      analysis = {
        title: 'Delicious Dinner',
        caption: 'A tasty meal captured',
        tags: [],
        nutrition: {},
        health_score: 50
      }
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update dinner with AI analysis
    await supabase
      .from('dinners')
      .update({
        title: analysis.title,
        ai_caption: analysis.caption,
        nutrition_calories: analysis.nutrition.calories,
        nutrition_protein_g: analysis.nutrition.protein_g,
        nutrition_carbs_g: analysis.nutrition.carbs_g,
        nutrition_fat_g: analysis.nutrition.fat_g,
        nutrition_fiber_g: analysis.nutrition.fiber_g,
        health_score: analysis.health_score
      })
      .eq('id', dinnerId)

    // Insert AI-generated tags
    const tagInserts = analysis.tags
      .filter(tag => tag.confidence > 0.5) // Only high-confidence tags
      .map(tag => ({
        dinner_id: dinnerId,
        name: tag.name,
        type: tag.type,
        source: 'ai' as const,
        approved: false,
        confidence: tag.confidence
      }))

    if (tagInserts.length > 0) {
      await supabase.from('tags').insert(tagInserts)
    }

    // Generate embedding for semantic search
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: `${analysis.title} ${analysis.caption} ${analysis.tags.map(t => t.name).join(' ')}`
      })
    })

    const embeddingResult = await embeddingResponse.json()
    const embedding = embeddingResult.data[0]?.embedding

    if (embedding) {
      await supabase.from('embeddings').insert({
        dinner_id: dinnerId,
        content: `${analysis.title} ${analysis.caption}`,
        embedding: embedding
      })
    }

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