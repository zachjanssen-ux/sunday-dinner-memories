import { createClient } from '@supabase/supabase-js'

const PLAN_LIMITS = {
  starter: {
    scansPerMonth: 30,
    apiCreditCap: null,
    aiSearch: false,
    mealPlan: false,
    shoppingList: false,
    cookbookBuilder: false,
    imageGen: false,
  },
  homemade: {
    scansPerMonth: 100,
    apiCreditCap: 4.0,
    aiSearch: true,
    mealPlan: true,
    shoppingList: true,
    cookbookBuilder: false,
    imageGen: false,
  },
  heirloom: {
    scansPerMonth: Infinity,
    apiCreditCap: 7.0,
    aiSearch: true,
    mealPlan: true,
    shoppingList: true,
    cookbookBuilder: true,
    imageGen: true,
  },
}

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )
}

/**
 * Check if a family can perform a given action based on their subscription and usage.
 * @param {string} familyId
 * @param {string} actionType - 'scan', 'aiSearch', 'aiChat', 'mealPlan', 'imageGen', etc.
 * @returns {{ allowed: boolean, error?: string, subscription?: object, usage?: object }}
 */
export async function checkUsageLimits(familyId, actionType) {
  const supabase = getSupabase()

  // Fetch subscription
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .maybeSingle()

  if (subError) {
    console.error('Error fetching subscription:', subError)
    return { allowed: false, error: 'Failed to verify subscription' }
  }

  if (!subscription) {
    return { allowed: false, error: 'No active subscription. Please choose a plan to use AI features.' }
  }

  const limits = PLAN_LIMITS[subscription.plan_tier]
  if (!limits) {
    return { allowed: false, error: 'Unknown plan tier' }
  }

  // Check feature access for non-scan actions
  const featureMap = {
    aiSearch: 'aiSearch',
    aiChat: 'aiSearch',
    mealPlan: 'mealPlan',
    shoppingList: 'shoppingList',
    cookbookBuilder: 'cookbookBuilder',
    imageGen: 'imageGen',
  }

  if (featureMap[actionType] && !limits[featureMap[actionType]]) {
    return {
      allowed: false,
      error: `This feature requires a higher plan. Please upgrade to access it.`,
    }
  }

  // Fetch usage
  const { data: usage, error: usageError } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('family_id', familyId)
    .maybeSingle()

  if (usageError) {
    console.error('Error fetching usage:', usageError)
    return { allowed: false, error: 'Failed to check usage limits' }
  }

  // For scan-type actions, check scan count (include bonus from add-on packs)
  if (actionType === 'scan') {
    const scansUsed = usage?.scans_used || 0
    const bonusScans = usage?.bonus_scans || 0
    const totalScansAllowed = limits.scansPerMonth + bonusScans
    if (limits.scansPerMonth !== Infinity && scansUsed >= totalScansAllowed) {
      return {
        allowed: false,
        error: `You've used all ${totalScansAllowed} AI scans for this billing period. Purchase an Extra Scan Pack or upgrade your plan for more.`,
      }
    }
  }

  // Check API credit cap for actions that use credits
  const creditActions = ['scan', 'aiSearch', 'aiChat', 'mealPlan']
  if (creditActions.includes(actionType) && limits.apiCreditCap) {
    const creditsUsed = usage?.api_credits_used || 0
    if (creditsUsed >= limits.apiCreditCap) {
      return {
        allowed: false,
        error: `You've reached your $${limits.apiCreditCap.toFixed(2)} API credit cap for this billing period. Upgrade for a higher cap.`,
      }
    }
  }

  return { allowed: true, subscription, usage }
}

/**
 * Record usage after a successful AI call.
 * @param {string} familyId
 * @param {string} userId
 * @param {string} actionType - 'scan', 'aiSearch', 'aiChat', 'mealPlan', etc.
 * @param {number} apiCost - cost of the API call
 * @param {string} modelUsed - model identifier
 * @param {string|null} recipeId - optional recipe ID
 */
export async function recordUsage(familyId, userId, actionType, apiCost = 0, modelUsed = '', recipeId = null) {
  const supabase = getSupabase()

  // Update usage counters
  const isScan = actionType === 'scan'

  // Fetch current usage to increment
  const { data: current } = await supabase
    .from('usage_tracking')
    .select('scans_used, api_credits_used')
    .eq('family_id', familyId)
    .maybeSingle()

  const updates = {
    api_credits_used: (current?.api_credits_used || 0) + apiCost,
    updated_at: new Date().toISOString(),
  }

  if (isScan) {
    updates.scans_used = (current?.scans_used || 0) + 1
  }

  await supabase
    .from('usage_tracking')
    .update(updates)
    .eq('family_id', familyId)

  // Insert into usage log
  await supabase
    .from('usage_log')
    .insert({
      family_id: familyId,
      user_id: userId,
      action_type: actionType,
      api_cost: apiCost,
      model_used: modelUsed,
      recipe_id: recipeId,
    })
}
