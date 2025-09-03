import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string
  userId: string
  limit?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, userId, limit = 20 }: SearchRequest = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First try to parse natural language into structured filters
    const structuredResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a query parser for a dinner documentation app. Parse natural language queries into structured filters.

Available filters:
- date_range: "last_week", "last_month", "this_year", or specific dates
- place_types: ["home", "restaurant", "friend", "other"]
- cuisines: ["italian", "japanese", "indian", "mexican", "chinese", "thai", "american", etc.]
- ingredients: ["chicken", "salmon", "beef", "pasta", "rice", "tofu", etc.]
- diets: ["vegetarian", "vegan", "pescetarian", "halal"]
- methods: ["grilled", "fried", "baked", "steamed", "raw"]
- courses: ["main", "dessert", "appetizer", "side"]

Return JSON with these fields (only include relevant ones):
{
  "semantic_search": true/false,
  "filters": {
    "date_range": "last_week",
    "place_types": ["home"],
    "cuisines": ["italian"],
    "ingredients": ["pasta"],
    "diets": ["vegetarian"]
  },
  "keywords": ["remaining", "keywords", "for", "semantic", "search"]
}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1
      })
    })

    const parsedResult = await structuredResponse.json()
    let queryParsed
    try {
      queryParsed = JSON.parse(parsedResult.choices[0]?.message?.content || '{}')
    } catch {
      queryParsed = { semantic_search: true, keywords: [query] }
    }

    let dinnerQuery = supabase
      .from('dinners')
      .select(`
        id, title, datetime, notes, ai_caption, favorite, health_score,
        places(name, type),
        photos(url),
        tags(name, type, approved)
      `)
      .eq('user_id', userId)
      .order('datetime', { ascending: false })

    // Apply structured filters
    const filters = queryParsed.filters || {}
    
    // Date range filter
    if (filters.date_range) {
      const now = new Date()
      let startDate: Date
      
      switch (filters.date_range) {
        case 'last_week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'last_month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }
      
      dinnerQuery = dinnerQuery.gte('datetime', startDate.toISOString())
    }

    const { data: dinners, error } = await dinnerQuery.limit(limit)
    
    if (error) throw error

    let results = dinners || []

    // Apply client-side filtering for complex queries
    if (filters.place_types?.length) {
      results = results.filter(d => 
        d.places && filters.place_types.includes(d.places.type)
      )
    }

    if (filters.cuisines?.length || filters.ingredients?.length || filters.diets?.length) {
      results = results.filter(d => {
        const tags = d.tags?.map(t => t.name.toLowerCase()) || []
        
        const hasCuisine = !filters.cuisines?.length || 
          filters.cuisines.some(c => tags.includes(c.toLowerCase()))
        
        const hasIngredient = !filters.ingredients?.length || 
          filters.ingredients.some(i => tags.includes(i.toLowerCase()))
          
        const hasDiet = !filters.diets?.length || 
          filters.diets.some(diet => tags.includes(diet.toLowerCase()))
        
        return hasCuisine && hasIngredient && hasDiet
      })
    }

    // If semantic search is needed and we have keywords
    if (queryParsed.semantic_search && queryParsed.keywords?.length) {
      const searchText = queryParsed.keywords.join(' ')
      
      // Generate embedding for search query
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: searchText
        })
      })

      const embeddingResult = await embeddingResponse.json()
      const queryEmbedding = embeddingResult.data[0]?.embedding

      if (queryEmbedding) {
        // Find similar embeddings
        const { data: similarEmbeddings } = await supabase.rpc('match_embeddings', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit
        })

        if (similarEmbeddings?.length) {
          const similarDinnerIds = similarEmbeddings.map(e => e.dinner_id)
          results = results.filter(d => similarDinnerIds.includes(d.id))
          
          // Sort by similarity score
          results.sort((a, b) => {
            const aScore = similarEmbeddings.find(e => e.dinner_id === a.id)?.similarity || 0
            const bScore = similarEmbeddings.find(e => e.dinner_id === b.id)?.similarity || 0
            return bScore - aScore
          })
        }
      }
    }

    return new Response(JSON.stringify({
      results: results.slice(0, limit),
      total: results.length,
      query_parsed: queryParsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI Search Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})