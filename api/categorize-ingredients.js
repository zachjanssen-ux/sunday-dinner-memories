import { getOpenRouterClient, MODELS } from './_lib/openrouter.js'

const client = getOpenRouterClient()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { ingredients } = req.body

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients array is required' })
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

    return res.status(200).json({ categories })
  } catch (err) {
    console.error('Categorization error:', err)
    // Return empty categories on failure — the client has fallback logic
    return res.status(200).json({ categories: {} })
  }
}
