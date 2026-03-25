import { getOpenRouterClient, MODELS } from './_lib/openrouter.js'
import { checkUsageLimits, recordUsage } from './_lib/usage.js'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

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
    const { file, fileType, familyId, userId } = req.body

    if (!file || !fileType) {
      return res.status(400).json({ error: 'File data and fileType are required' })
    }

    // Check usage limits if familyId provided
    if (familyId) {
      const check = await checkUsageLimits(familyId, 'scan')
      if (!check.allowed) {
        Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
        return res.status(403).json({ error: check.error, usageLimited: true })
      }
    }

    const buffer = Buffer.from(file, 'base64')
    let extractedText = ''

    if (fileType === 'pdf') {
      const pdfData = await pdf(buffer)
      extractedText = pdfData.text
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use pdf or docx.' })
    }

    if (!extractedText.trim()) {
      Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
      return res.status(400).json({
        error: 'No text could be extracted from the document',
      })
    }

    const client = getOpenRouterClient()

    const response = await client.chat.completions.create({
      model: MODELS.TEXT,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${RECIPE_EXTRACTION_PROMPT}\n\nHere is the text:\n\n${extractedText}`,
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
      await recordUsage(familyId, userId, 'scan', 0, MODELS.TEXT)
    }

    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Import document error:', error)
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(500).json({
      error: 'Failed to import document',
      message: error.message,
    })
  }
}
