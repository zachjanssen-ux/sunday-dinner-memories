import { getOpenRouterClient, MODELS } from './_lib/openrouter.js'
import { checkUsageLimits, recordUsage } from './_lib/usage.js'

const client = getOpenRouterClient()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { ingredients, familyId, userId } = req.body

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients array is required' })
  }

  // Check usage limits if familyId provided
  if (familyId) {
    try {
      const check = await checkUsageLimits(familyId, 'mealPlan')
      if (!check.allowed) {
        return res.status(403).json({ error: check.error, usageLimited: true })
      }
    } catch (err) {
      console.error('Usage check error:', err)
    }
  }

  try {
    const response = await client.chat.completions.create({
      model: MODELS.TEXT,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Categorize each ingredient into one of these grocery store aisle categories: produce, dairy, meat, bakery, frozen, canned, dry_goods, spices, beverages, other.

Return ONLY a valid JSON object where each key is the ingredient name (exactly as given) and the value is the category string.

Ingredients:
${ingredients.map((i) => `- ${i}`).join('\n')}

JSON response:`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content || '{}'

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const categories = JSON.parse(jsonStr)

    // Record usage
    if (familyId && userId) {
      await recordUsage(familyId, userId, 'mealPlan', 0, MODELS.TEXT)
    }

    return res.status(200).json({ categories })
  } catch (err) {
    console.error('Categorization error:', err)
    // Return empty categories on failure — the client has fallback logic
    return res.status(200).json({ categories: {} })
  }
}
