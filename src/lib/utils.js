/**
 * Parse a quantity string into a numeric value.
 * Handles integers, decimals, fractions, and mixed numbers.
 */
export function parseQuantity(text) {
  if (!text || text.trim() === '') return null

  const trimmed = text.trim()

  // Pure decimal or integer: "2", "2.5"
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed)
  }

  // Pure fraction: "1/2", "3/4"
  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10)
    const den = parseInt(fractionMatch[2], 10)
    if (den === 0) return null
    return num / den
  }

  // Mixed number: "1 1/2", "2 3/4"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10)
    const num = parseInt(mixedMatch[2], 10)
    const den = parseInt(mixedMatch[3], 10)
    if (den === 0) return null
    return whole + num / den
  }

  // Non-numeric text like "a pinch of"
  return null
}

/**
 * Format a numeric quantity back to a readable string.
 * Converts decimals back to fractions where sensible.
 */
export function formatQuantity(num) {
  if (num == null) return ''

  const fractions = [
    { val: 0.125, str: '1/8' },
    { val: 0.25, str: '1/4' },
    { val: 1 / 3, str: '1/3' },
    { val: 0.375, str: '3/8' },
    { val: 0.5, str: '1/2' },
    { val: 2 / 3, str: '2/3' },
    { val: 0.75, str: '3/4' },
    { val: 0.875, str: '7/8' },
  ]

  const whole = Math.floor(num)
  const remainder = num - whole

  if (remainder < 0.01) {
    return whole.toString()
  }

  const closest = fractions.reduce((prev, curr) =>
    Math.abs(curr.val - remainder) < Math.abs(prev.val - remainder) ? curr : prev
  )

  if (Math.abs(closest.val - remainder) < 0.05) {
    return whole > 0 ? `${whole} ${closest.str}` : closest.str
  }

  // Fall back to decimal
  return Number(num.toFixed(2)).toString()
}

/**
 * Normalize a unit string to a canonical lowercase form.
 */
export function canonicalUnit(unit) {
  if (!unit) return ''
  const u = unit.trim().toLowerCase()
  const map = {
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
    tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
    cup: 'cup', cups: 'cup', c: 'cup',
    'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
    g: 'g', gram: 'g', grams: 'g',
    kg: 'kg', kilogram: 'kg', kilograms: 'kg',
    ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml',
    l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  }
  return map[u] || u
}

/**
 * Convert to larger units when possible.
 * 3 tsp -> 1 tbsp, 16 tbsp -> 1 cup, 8 fl oz -> 1 cup,
 * 16 oz -> 1 lb, 1000 g -> 1 kg, 1000 ml -> 1 l
 */
export function normalizeUnit(quantity, unit) {
  if (quantity == null || !unit) return { quantity, unit }

  const u = canonicalUnit(unit)

  const conversions = [
    { from: 'tsp', to: 'tbsp', factor: 3 },
    { from: 'tbsp', to: 'cup', factor: 16 },
    { from: 'fl oz', to: 'cup', factor: 8 },
    { from: 'oz', to: 'lb', factor: 16 },
    { from: 'g', to: 'kg', factor: 1000 },
    { from: 'ml', to: 'l', factor: 1000 },
  ]

  let currentQty = quantity
  let currentUnit = u

  // Keep converting up while possible
  let changed = true
  while (changed) {
    changed = false
    for (const conv of conversions) {
      if (currentUnit === conv.from && currentQty >= conv.factor) {
        currentQty = currentQty / conv.factor
        currentUnit = conv.to
        changed = true
        break
      }
    }
  }

  // Round to 2 decimal places to avoid floating point weirdness
  currentQty = Math.round(currentQty * 100) / 100

  return { quantity: currentQty, unit: currentUnit }
}

/**
 * Check if two units are compatible (same measurement system dimension).
 */
export function unitsCompatible(unitA, unitB) {
  const a = canonicalUnit(unitA)
  const b = canonicalUnit(unitB)
  if (a === b) return true

  const volumeUnits = ['tsp', 'tbsp', 'cup', 'fl oz', 'ml', 'l']
  const weightUnits = ['oz', 'lb', 'g', 'kg']

  if (volumeUnits.includes(a) && volumeUnits.includes(b)) return true
  if (weightUnits.includes(a) && weightUnits.includes(b)) return true
  return false
}

/**
 * Convert a quantity from one unit to a base unit for combining.
 * Returns quantity in the base unit of its class.
 * Volume base: tsp, Weight base: oz
 */
export function toBaseUnit(quantity, unit) {
  if (quantity == null) return { quantity, unit }
  const u = canonicalUnit(unit)

  // Volume -> tsp
  const volumeToTsp = { tsp: 1, tbsp: 3, cup: 48, 'fl oz': 6, ml: 0.202884, l: 202.884 }
  if (volumeToTsp[u] != null) {
    return { quantity: quantity * volumeToTsp[u], unit: 'tsp' }
  }

  // Weight -> oz
  const weightToOz = { oz: 1, lb: 16, g: 0.035274, kg: 35.274 }
  if (weightToOz[u] != null) {
    return { quantity: quantity * weightToOz[u], unit: 'oz' }
  }

  return { quantity, unit: u }
}

/**
 * Parse a full ingredient text like "1 cup (200g) granulated sugar"
 * into { quantity, unit, name } for display in the review form.
 */
export function parseIngredientText(raw) {
  if (!raw) return { quantity: '', unit: '', name: '' }

  const text = raw.trim()

  // Known units to match (case-insensitive)
  const units = [
    'cups?', 'tablespoons?', 'tbsp', 'Tbsp', 'Tablespoons?',
    'teaspoons?', 'tsp', 'Tsp',
    'ounces?', 'oz',
    'pounds?', 'lbs?', 'lb',
    'grams?', 'g',
    'kilograms?', 'kg',
    'milliliters?', 'ml', 'mL',
    'liters?', 'l', 'L',
    'pinch', 'dash', 'pieces?', 'cloves?', 'slices?',
    'cans?', 'sticks?', 'packages?', 'pkg',
  ]
  const unitPattern = units.join('|')

  // Try to match: number + unit + name
  // Handles: "1 cup flour", "1/2 cup sugar", "1 1/2 cups flour", "2.5 oz butter"
  const regex = new RegExp(
    `^(\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+\\.?\\d*)\\s+(?:\\([^)]*\\)\\s*)?(${unitPattern})\\s*(?:\\([^)]*\\)\\s*)?(.*)$`,
    'i'
  )

  const match = text.match(regex)
  if (match) {
    const qty = match[1].trim()
    let unit = match[2].trim().toLowerCase()
    let name = match[3].trim()
    // Remove leading parenthetical from name
    name = name.replace(/^\([^)]*\)\s*/, '')

    // Normalize unit
    if (/^cups?$/i.test(unit)) unit = 'cup'
    else if (/^tablespoons?$|^tbsp$/i.test(unit)) unit = 'tbsp'
    else if (/^teaspoons?$|^tsp$/i.test(unit)) unit = 'tsp'
    else if (/^ounces?$|^oz$/i.test(unit)) unit = 'oz'
    else if (/^pounds?$|^lbs?$/i.test(unit)) unit = 'lb'
    else if (/^grams?$|^g$/i.test(unit)) unit = 'g'

    return { quantity: qty, unit, name }
  }

  // Try just a number at the start with no unit: "4 large eggs"
  const numOnly = text.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)\s+(.+)$/)
  if (numOnly) {
    return { quantity: numOnly[1].trim(), unit: '', name: numOnly[2].trim() }
  }

  // No number found — return as-is
  return { quantity: '', unit: '', name: text }
}
