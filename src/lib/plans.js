export const PLANS = {
  starter: {
    name: 'Starter',
    price: 7,
    scanLimit: 30,
    features: ['manual_entry', 'scaling', 'tags', 'cookbooks', 'favorites', 'public_sharing', 'audio_memories', 'pdf_export'],
    excluded: ['ai_search', 'meal_planning', 'shopping_lists', 'cookbook_builder', 'image_gen'],
    creditCap: null, // uses scan count instead
  },
  homemade: {
    name: 'Homemade',
    price: 15,
    scanLimit: 100,
    features: ['manual_entry', 'scaling', 'tags', 'cookbooks', 'favorites', 'public_sharing', 'audio_memories', 'pdf_export', 'ai_search', 'meal_planning', 'shopping_lists'],
    excluded: ['cookbook_builder', 'image_gen'],
    creditCap: 4.00,
  },
  heirloom: {
    name: 'Heirloom',
    price: 20,
    scanLimit: null, // unlimited (up to credit cap)
    features: ['manual_entry', 'scaling', 'tags', 'cookbooks', 'favorites', 'public_sharing', 'audio_memories', 'pdf_export', 'ai_search', 'meal_planning', 'shopping_lists', 'cookbook_builder', 'image_gen'],
    excluded: [],
    creditCap: 7.00,
    imageGenCost: 0.30,
  },
}

/**
 * Check if a plan includes a specific feature
 */
export function planIncludesFeature(planTier, feature) {
  const plan = PLANS[planTier]
  if (!plan) return false
  return plan.features.includes(feature)
}

/**
 * Get the minimum plan required for a feature
 */
export function getRequiredPlanForFeature(feature) {
  const tiers = ['starter', 'homemade', 'heirloom']
  for (const tier of tiers) {
    if (PLANS[tier].features.includes(feature)) {
      return tier
    }
  }
  return 'heirloom'
}
