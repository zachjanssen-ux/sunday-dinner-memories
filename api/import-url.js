import { getOpenRouterClient, MODELS } from './_lib/openrouter.js'

const RECIPE_EXTRACTION_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the following text into valid JSON:
{
  "title": "string",
  "description": "string (brief description of the dish)",
  "original_cook": "string (who wrote/created this recipe, if visible)",
  "cuisine": "string (e.g. Italian, Southern, Mexican)",
  "difficulty": "string (easy, medium, hard)",
  "dietary_labels": ["string (e.g. vegetarian, gluten-free, dairy-free)"],
  "prep_time_min": number,
  "cook_time_min": number,
  "servings": number,
  "ingredients": [{ "name": "string", "quantity": "string", "unit": "string", "notes": "string" }],
  "instructions": [{ "step": number, "text": "string" }],
  "suggested_tags": ["string"],
  "notes": "string (any additional notes from the recipe)"
}
If information is missing, use null for that field. Respond ONLY with the JSON — no markdown fences, no explanation.`

const RECIPE_WITH_BLOG_PROMPT = `You are a recipe extraction assistant. Extract the recipe AND the blog narrative from the following text into valid JSON:
{
  "title": "string",
  "description": "string (brief description of the dish)",
  "original_cook": "string (who wrote/created this recipe, if visible)",
  "cuisine": "string (e.g. Italian, Southern, Mexican)",
  "difficulty": "string (easy, medium, hard)",
  "dietary_labels": ["string (e.g. vegetarian, gluten-free, dairy-free)"],
  "prep_time_min": number,
  "cook_time_min": number,
  "servings": number,
  "ingredients": [{ "name": "string", "quantity": "string", "unit": "string", "notes": "string" }],
  "instructions": [{ "step": number, "text": "string" }],
  "suggested_tags": ["string"],
  "notes": "string (any additional notes from the recipe)",
  "blog_content": "string (the story/narrative from the blog post, before the recipe)"
}
If information is missing, use null for that field. Respond ONLY with the JSON — no markdown fences, no explanation.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function extractJsonLdRecipe(html) {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      let data = JSON.parse(match[1])

      // Handle arrays
      if (Array.isArray(data)) {
        data = data.find((d) => d['@type'] === 'Recipe')
      }

      // Handle @graph
      if (data['@graph']) {
        data = data['@graph'].find((d) => d['@type'] === 'Recipe')
      }

      if (data && data['@type'] === 'Recipe') {
        return {
          title: data.name || null,
          description: data.description || null,
          original_cook: data.author?.name || (typeof data.author === 'string' ? data.author : null),
          cuisine: Array.isArray(data.recipeCuisine)
            ? data.recipeCuisine[0]
            : data.recipeCuisine || null,
          difficulty: null,
          dietary_labels: data.suitableForDiet
            ? (Array.isArray(data.suitableForDiet) ? data.suitableForDiet : [data.suitableForDiet])
            : [],
          prep_time_min: parseIsoDuration(data.prepTime),
          cook_time_min: parseIsoDuration(data.cookTime),
          servings: parseServings(data.recipeYield),
          ingredients: (data.recipeIngredient || []).map((ing) => ({
            name: ing,
            quantity: '',
            unit: '',
            notes: '',
          })),
          instructions: parseInstructions(data.recipeInstructions),
          suggested_tags: Array.isArray(data.recipeCategory)
            ? data.recipeCategory
            : data.recipeCategory
              ? [data.recipeCategory]
              : [],
          notes: null,
        }
      }
    } catch {
      // Continue to next script tag
    }
  }

  return null
}

function parseIsoDuration(duration) {
  if (!duration) return null
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return null
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  return hours * 60 + minutes || null
}

function parseServings(yield_) {
  if (!yield_) return null
  if (typeof yield_ === 'number') return yield_
  const str = Array.isArray(yield_) ? yield_[0] : yield_
  const num = parseInt(str, 10)
  return isNaN(num) ? null : num
}

function parseInstructions(instructions) {
  if (!instructions) return []
  if (typeof instructions === 'string') {
    return instructions
      .split(/\n/)
      .filter((s) => s.trim())
      .map((text, i) => ({ step: i + 1, text: text.trim() }))
  }
  if (Array.isArray(instructions)) {
    return instructions.map((inst, i) => {
      if (typeof inst === 'string') return { step: i + 1, text: inst }
      if (inst['@type'] === 'HowToStep') return { step: i + 1, text: inst.text || '' }
      if (inst['@type'] === 'HowToSection') {
        // Flatten sections
        return (inst.itemListElement || []).map((sub, j) => ({
          step: j + 1,
          text: sub.text || '',
        }))
      }
      return { step: i + 1, text: inst.text || JSON.stringify(inst) }
    }).flat()
  }
  return []
}

function stripHtml(html) {
  // Remove script and style tags
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '')
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '')
  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|br|tr)>/gi, '\n')
  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, '')
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&#\d+;/g, '')
  // Collapse whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()
  // Truncate to avoid token limits
  if (text.length > 15000) {
    text = text.substring(0, 15000)
  }
  return text
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
    const { url, recipeOnly = true } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SundayDinnerMemories/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
      return res.status(400).json({
        error: `Could not fetch URL (status ${response.status})`,
      })
    }

    const html = await response.text()

    // Tier 1: Try JSON-LD
    const jsonLdRecipe = extractJsonLdRecipe(html)
    if (jsonLdRecipe) {
      Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
      return res.status(200).json({
        ...jsonLdRecipe,
        _source: 'json-ld',
      })
    }

    // Tier 2/3: Fall back to AI
    const strippedText = stripHtml(html)

    const client = getOpenRouterClient()

    const prompt = recipeOnly ? RECIPE_EXTRACTION_PROMPT : RECIPE_WITH_BLOG_PROMPT

    const aiResponse = await client.chat.completions.create({
      model: MODELS.TEXT,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nHere is the text from the webpage:\n\n${strippedText}`,
        },
      ],
    })

    const text = aiResponse.choices[0]?.message?.content || ''
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

    parsed._source = 'ai'

    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Import URL error:', error)
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(500).json({
      error: 'Failed to import from URL',
      message: error.message,
    })
  }
}
