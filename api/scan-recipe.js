import { getOpenRouterClient, MODELS } from './_lib/openrouter.js'

const RECIPE_EXTRACTION_PROMPT = `You are a recipe extraction assistant. Analyze this image of a recipe card and extract the following into valid JSON:
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
If handwriting is unclear, add [?] after uncertain words. Respond ONLY with the JSON — no markdown fences, no explanation.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, mimeType } = req.body

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' })
    }

    const client = getOpenRouterClient()

    const response = await client.chat.completions.create({
      model: MODELS.VISION,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${image}`,
              },
            },
            {
              type: 'text',
              text: RECIPE_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    })

    const text = response.choices[0]?.message?.content || ''
    let parsed

    try {
      parsed = JSON.parse(text)
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Scan recipe error:', error)
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(500).json({
      error: 'Failed to scan recipe',
      message: error.message,
    })
  }
}
