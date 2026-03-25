import { getOpenRouterClient, MODELS } from './_lib/openrouter.js'
import { checkUsageLimits, recordUsage } from './_lib/usage.js'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query, familyId, userId } = req.body

    if (!query || !familyId) {
      return res.status(400).json({ error: 'Missing query or familyId' })
    }

    // Check usage limits
    if (familyId) {
      const check = await checkUsageLimits(familyId, 'aiSearch')
      if (!check.allowed) {
        Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
        return res.status(403).json({ error: check.error, usageLimited: true })
      }
    }

    // Init Supabase with service role to bypass RLS
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    )

    // Fetch all family recipes with ingredients and cook info
    const { data: recipes, error: dbError } = await supabase
      .from('recipes')
      .select(`
        id, title, description, category, cuisine, difficulty, dietary_labels,
        prep_time_minutes, cook_time_minutes, servings, notes,
        cooks ( name ),
        recipe_ingredients ( ingredient_name ),
        recipe_tags ( tags ( name ) )
      `)
      .eq('family_id', familyId)

    if (dbError) throw dbError

    if (!recipes || recipes.length === 0) {
      Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
      return res.status(200).json({
        results: [],
        message: 'No recipes in collection yet.',
      })
    }

    // Build recipe summaries for the context
    const recipeSummaries = recipes.map((r) => {
      const ingredients = (r.recipe_ingredients || [])
        .map((i) => i.ingredient_name)
        .join(', ')
      const tags = (r.recipe_tags || [])
        .map((t) => t.tags?.name)
        .filter(Boolean)
        .join(', ')
      const cook = r.cooks?.name || 'Unknown'

      return `- ID: ${r.id} | "${r.title}" by ${cook} | ${r.category || 'uncategorized'} | ${r.cuisine || 'no cuisine'} | Ingredients: ${ingredients || 'none listed'} | Tags: ${tags || 'none'} | Dietary: ${(r.dietary_labels || []).join(', ') || 'none'} | ${r.description || 'no description'} | Difficulty: ${r.difficulty || 'unknown'} | Notes: ${r.notes || 'none'}`
    }).join('\n')

    const client = getOpenRouterClient()

    const response = await client.chat.completions.create({
      model: MODELS.TEXT,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a recipe search assistant for a family recipe collection. Given the following recipes and a search query, return the most relevant recipe IDs ranked by relevance. For each result, provide a brief warm reason why it matches (1 sentence, speak as if talking to a family member).

Return ONLY valid JSON in this exact format, no markdown fences:
{"results": [{"id": "uuid", "reason": "why this matches"}]}

If nothing matches well, return {"results": []}.

Query: "${query}"

Recipes:
${recipeSummaries}`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content || ''
    let parsed

    try {
      parsed = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    // Record usage
    if (familyId && userId) {
      await recordUsage(familyId, userId, 'aiSearch', 0, MODELS.TEXT)
    }

    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(200).json(parsed)
  } catch (error) {
    console.error('AI search error:', error)
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(500).json({
      error: 'AI search failed',
      message: error.message,
    })
  }
}
