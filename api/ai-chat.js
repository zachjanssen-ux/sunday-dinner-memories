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
    const { message, familyId, history, userId } = req.body

    if (!message || !familyId) {
      return res.status(400).json({ error: 'Missing message or familyId' })
    }

    // Check usage limits
    if (familyId) {
      const check = await checkUsageLimits(familyId, 'aiChat')
      if (!check.allowed) {
        Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
        return res.status(403).json({ error: check.error, usageLimited: true })
      }
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    )

    const { data: recipes, error: dbError } = await supabase
      .from('recipes')
      .select(`
        id, title, description, category, cuisine, difficulty, dietary_labels,
        prep_time_minutes, cook_time_minutes, servings, notes,
        cooks ( name ),
        recipe_ingredients ( ingredient_name, quantity_text, unit ),
        recipe_tags ( tags ( name ) )
      `)
      .eq('family_id', familyId)

    if (dbError) throw dbError

    const recipeSummaries = (recipes || []).map((r) => {
      const ingredients = (r.recipe_ingredients || [])
        .map((i) => `${i.quantity_text || ''} ${i.unit || ''} ${i.ingredient_name}`.trim())
        .join(', ')
      const tags = (r.recipe_tags || [])
        .map((t) => t.tags?.name)
        .filter(Boolean)
        .join(', ')
      const cook = r.cooks?.name || 'Unknown'

      return `- "${r.title}" (ID: ${r.id}) by ${cook} | ${r.category || ''} ${r.cuisine || ''} | Ingredients: ${ingredients || 'none'} | Tags: ${tags || 'none'} | ${r.description || ''}`
    }).join('\n')

    const systemPrompt = `You are a warm, helpful recipe assistant for a family recipe collection called Sunday Dinner Memories. You help family members find recipes, suggest meals, and answer cooking questions based on their family's recipe collection.

When suggesting recipes, always mention the recipe title and who made it. Include the recipe ID in parentheses like (ID: uuid) so the app can link to it.

Be conversational and warm — like a family member helping in the kitchen. Keep responses concise (2-4 sentences per suggestion). If asked about recipes not in the collection, say so kindly.

${recipes && recipes.length > 0 ? `Family recipe collection (${recipes.length} recipes):\n${recipeSummaries}` : 'This family has no recipes yet. Encourage them to add some!'}`

    // Build conversation messages with system prompt as first message
    const messages = [
      { role: 'system', content: systemPrompt },
    ]
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    }
    messages.push({ role: 'user', content: message })

    const client = getOpenRouterClient()

    const response = await client.chat.completions.create({
      model: MODELS.CHAT,
      max_tokens: 1024,
      messages,
    })

    const reply = response.choices[0]?.message?.content || ''

    // Extract recipe IDs mentioned in the response
    const idMatches = reply.match(/\(ID:\s*([a-f0-9-]+)\)/gi) || []
    const mentionedIds = idMatches.map((m) => {
      const match = m.match(/([a-f0-9-]{36})/)
      return match ? match[1] : null
    }).filter(Boolean)

    // Record usage
    if (familyId && userId) {
      await recordUsage(familyId, userId, 'aiChat', 0, MODELS.CHAT)
    }

    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(200).json({
      reply,
      mentionedRecipeIds: mentionedIds,
    })
  } catch (error) {
    console.error('AI chat error:', error)
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(500).json({
      error: 'AI chat failed',
      message: error.message,
    })
  }
}
