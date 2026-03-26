import { getOpenRouterClient, MODELS } from './_lib/openrouter.js'
import { checkUsageLimits, recordUsage } from './_lib/usage.js'

const SINGLE_IMAGE_PROMPT = `You are a recipe extraction assistant. Analyze this image of a recipe card and extract the following into valid JSON:
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
  "ingredients": [{ "name": "string (just the ingredient name)", "quantity": "string (the amount, e.g. 1, 1/2, 2.5)", "unit": "string (cup, tbsp, tsp, oz, lb, etc.)", "notes": "string (prep notes like chopped, room temp)" }],
  "instructions": [{ "step": number, "text": "string" }],
  "suggested_tags": ["string"],
  "notes": "string (any additional notes from the recipe)"
}
IMPORTANT: For ingredients, ALWAYS separate the quantity and unit from the name. "2 cups flour" should be quantity:"2", unit:"cup", name:"flour".
If handwriting is unclear, add [?] after uncertain words. Respond ONLY with the JSON — no markdown fences, no explanation.`

const MULTI_IMAGE_PROMPT = `You are a recipe extraction assistant. I'm showing you TWO images of the SAME recipe card — the front and the back. Combine ALL information from both sides into a single recipe. Extract the following into valid JSON:
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
  "ingredients": [{ "name": "string (just the ingredient name)", "quantity": "string (the amount, e.g. 1, 1/2, 2.5)", "unit": "string (cup, tbsp, tsp, oz, lb, etc.)", "notes": "string (prep notes like chopped, room temp)" }],
  "instructions": [{ "step": number, "text": "string" }],
  "suggested_tags": ["string"],
  "notes": "string (any additional notes from the recipe)"
}
IMPORTANT: Combine ingredients and instructions from BOTH sides of the card. For ingredients, ALWAYS separate the quantity and unit from the name.
If handwriting is unclear, add [?] after uncertain words. Respond ONLY with the JSON — no markdown fences, no explanation.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
    const { image, images, mimeType, familyId, userId } = req.body

    // Support both single image (backward compat) and multi-image
    let imageList = []

    if (images && Array.isArray(images) && images.length > 0) {
      // Multi-image mode: [{ base64, mimeType, label }]
      imageList = images
    } else if (image) {
      // Single image mode (backward compat)
      imageList = [{ base64: image, mimeType: mimeType || 'image/jpeg', label: 'Front' }]
    } else {
      return res.status(400).json({ error: 'No image data provided' })
    }

    // Check usage limits
    if (familyId) {
      const check = await checkUsageLimits(familyId, 'scan')
      if (!check.allowed) {
        Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
        return res.status(403).json({ error: check.error, usageLimited: true })
      }
    }

    const client = getOpenRouterClient()
    const isMultiSide = imageList.length > 1
    const prompt = isMultiSide ? MULTI_IMAGE_PROMPT : SINGLE_IMAGE_PROMPT

    // Build message content with image(s) + prompt
    const content = []

    imageList.forEach((img, idx) => {
      if (isMultiSide) {
        content.push({
          type: 'text',
          text: `[${img.label || (idx === 0 ? 'Front' : 'Back')} of recipe card]`,
        })
      }
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`,
        },
      })
    })

    content.push({
      type: 'text',
      text: prompt,
    })

    const response = await client.chat.completions.create({
      model: MODELS.VISION,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content,
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
      await recordUsage(familyId, userId, 'scan', 0, MODELS.VISION)
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
