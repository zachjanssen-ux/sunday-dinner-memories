import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import {
  Clock,
  Utensils,
  Heart,
  BookmarkPlus,
  Download,
  ExternalLink,
  Loader2,
  Check,
} from 'lucide-react'

const difficultyLabels = {
  easy: 'Easy',
  medium: 'Medium',
  advanced: 'Advanced',
}

const difficultyStyles = {
  easy: 'bg-herb/20 text-herb',
  medium: 'bg-butter/20 text-sunday-brown',
  advanced: 'bg-tomato/20 text-tomato',
}

function OGMeta({ recipe }) {
  useEffect(() => {
    // Set document title
    document.title = recipe.title
      ? `${recipe.title} — Sunday Dinner Memories`
      : 'Sunday Dinner Memories'

    // Set OG meta tags
    const setMeta = (property, content) => {
      if (!content) return
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const setMetaName = (name, content) => {
      if (!content) return
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const desc = recipe.description || `A family recipe from Sunday Dinner Memories`
    const img = recipe.original_image_url || ''

    setMeta('og:title', recipe.title)
    setMeta('og:description', desc)
    setMeta('og:type', 'article')
    setMeta('og:url', window.location.href)
    if (img) setMeta('og:image', img)

    // Twitter Card
    setMetaName('twitter:card', img ? 'summary_large_image' : 'summary')
    setMetaName('twitter:title', recipe.title)
    setMetaName('twitter:description', desc)
    if (img) setMetaName('twitter:image', img)

    return () => {
      document.title = 'Sunday Dinner Memories'
    }
  }, [recipe])

  return null
}

export default function PublicRecipe() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, currentMember } = useAuthStore()

  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveCount, setSaveCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    fetchPublicRecipe()
  }, [slug])

  const fetchPublicRecipe = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        cooks ( id, name, bio, photo_url ),
        recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order, ingredients ( id, name ) )
      `)
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single()

    if (error || !data) {
      setLoading(false)
      return
    }

    setRecipe({
      ...data,
      cook_name: data.cooks?.name || 'Unknown',
    })

    // Fetch save count
    const { count } = await supabase
      .from('recipe_saves')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', data.id)

    setSaveCount(count || 0)

    // Check if current user already saved
    if (currentMember?.family_id) {
      const { data: existingSave } = await supabase
        .from('recipe_saves')
        .select('id')
        .eq('recipe_id', data.id)
        .eq('family_id', currentMember.family_id)
        .maybeSingle()

      setAlreadySaved(!!existingSave)
    }

    setLoading(false)
  }

  const handleSaveToFamily = async () => {
    if (!user) {
      // Redirect to register with return URL
      navigate(`/register?returnTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (!currentMember?.family_id) {
      navigate('/create-family')
      return
    }

    if (alreadySaved) return

    setSaving(true)

    // Insert into recipe_saves
    const { error: saveError } = await supabase
      .from('recipe_saves')
      .insert({
        recipe_id: recipe.id,
        family_id: currentMember.family_id,
        saved_by: currentMember.id,
      })

    if (saveError) {
      console.error('Error saving recipe:', saveError)
      setSaving(false)
      return
    }

    // Clone recipe into user's family using RPC to avoid INSERT → SELECT hang
    const instructionsJson = recipe.instructions || null

    const cloneData = {
      family_id: currentMember.family_id,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      prep_time_min: recipe.prep_time_min,
      cook_time_min: recipe.cook_time_min,
      servings: recipe.servings,
      notes: recipe.notes,
      original_image_url: recipe.original_image_url,
      dietary_labels: recipe.dietary_labels,
      instructions: instructionsJson,
      source: 'saved',
      source_url: `${window.location.origin}/r/${slug}`,
      contributed_by: currentMember.id,
    }

    const { data: newRecipeId, error: cloneError } = await supabase.rpc('create_recipe', {
      recipe_data: cloneData,
    })

    if (cloneError) {
      console.error('Error cloning recipe:', cloneError)
      setSaving(false)
      return
    }

    // Clone ingredients
    if (recipe.recipe_ingredients?.length > 0) {
      const ingredientRows = recipe.recipe_ingredients.map((ing) => ({
        recipe_id: newRecipeId,
        ingredient_id: ing.ingredient_id || null,
        quantity: ing.quantity || '',
        quantity_numeric: ing.quantity_numeric,
        unit: ing.unit || '',
        notes: ing.notes || '',
        sort_order: ing.sort_order,
      }))
      await supabase.from('recipe_ingredients').insert(ingredientRows)
    }

    // Instructions are already cloned as JSONB on the recipe itself (no separate table)

    setSaving(false)
    setAlreadySaved(true)
    setSavedSuccess(true)
    setSaveCount((prev) => prev + 1)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const ingredients = (recipe?.recipe_ingredients || [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const instructions = (recipe?.instructions || [])
    .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))

  const blogContent = recipe?.blog_content

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sienna animate-spin mx-auto mb-4" />
          <p className="text-sunday-brown font-body">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-3xl font-display text-cast-iron mb-3">Recipe Not Found</h1>
          <p className="text-sunday-brown font-body mb-6">
            This recipe may be private or no longer available.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sienna text-flour
              font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <OGMeta recipe={recipe} />

      {/* Header bar */}
      <header className="bg-flour/80 backdrop-blur-sm border-b border-stone/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="font-display text-lg text-cast-iron hover:text-sienna transition-colors">
            Sunday Dinner Memories
          </a>
          {!user && (
            <a
              href="/register"
              className="px-4 py-2 rounded-lg bg-sienna text-flour text-sm font-body font-semibold
                shadow-sm hover:bg-sienna/90 transition-colors"
            >
              Join Free
            </a>
          )}
        </div>
      </header>

      {/* Hero photo */}
      {recipe.original_image_url && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="rounded-2xl overflow-hidden shadow-lg max-h-[500px]">
            <img
              src={recipe.original_image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <article className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <h1 className="text-4xl lg:text-5xl font-display text-cast-iron leading-tight mb-3">
          {recipe.title}
        </h1>

        {/* Cook attribution */}
        {recipe.cook_name && (
          <p className="font-handwritten text-2xl text-sunday-brown/70 mb-4">
            A recipe by {recipe.cook_name}
          </p>
        )}

        {/* Save count */}
        {saveCount > 0 && (
          <div className="flex items-center gap-1.5 text-stone mb-4">
            <Heart className="w-4 h-4 fill-tomato/30 text-tomato/50" />
            <span className="text-sm font-body">
              Saved by {saveCount} {saveCount === 1 ? 'family' : 'families'}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.category && (
            <span className="text-sm font-body font-semibold px-3 py-1.5 rounded-full bg-sage/30 text-sunday-brown">
              {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
            </span>
          )}
          {recipe.cuisine && (
            <span className="text-sm font-body font-semibold px-3 py-1.5 rounded-full bg-honey/20 text-sunday-brown">
              {recipe.cuisine.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
          {recipe.difficulty && (
            <span
              className={`text-sm font-body font-semibold px-3 py-1.5 rounded-full ${
                difficultyStyles[recipe.difficulty] || ''
              }`}
            >
              {difficultyLabels[recipe.difficulty] || recipe.difficulty}
            </span>
          )}
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-lg font-body text-sunday-brown/80 mb-8 leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Time & servings bar */}
        {(recipe.prep_time_min || recipe.cook_time_min || recipe.servings) && (
          <div className="flex flex-wrap items-center gap-6 py-4 px-6 bg-linen rounded-xl border border-stone/10 mb-8">
            {recipe.prep_time_min && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sienna" />
                <div>
                  <p className="text-xs font-body text-stone uppercase tracking-wide">Prep</p>
                  <p className="font-body font-semibold text-sunday-brown">{recipe.prep_time_min} min</p>
                </div>
              </div>
            )}
            {recipe.cook_time_min && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sienna" />
                <div>
                  <p className="text-xs font-body text-stone uppercase tracking-wide">Cook</p>
                  <p className="font-body font-semibold text-sunday-brown">{recipe.cook_time_min} min</p>
                </div>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-sienna" />
                <div>
                  <p className="text-xs font-body text-stone uppercase tracking-wide">Servings</p>
                  <p className="font-body font-semibold text-sunday-brown">{recipe.servings}</p>
                </div>
              </div>
            )}
            {recipe.prep_time_min && recipe.cook_time_min && (
              <div className="flex items-center gap-2 ml-auto">
                <div>
                  <p className="text-xs font-body text-stone uppercase tracking-wide">Total</p>
                  <p className="font-body font-semibold text-sunday-brown">
                    {recipe.prep_time_min + recipe.cook_time_min} min
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blog story */}
        {blogContent?.body && (
          <div className="mb-10">
            <div className="font-body text-sunday-brown text-lg leading-relaxed">
              <ReactMarkdown
                components={{
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-sienna/40 pl-4 my-6 font-handwritten text-2xl text-sunday-brown/80 italic">
                      {children}
                    </blockquote>
                  ),
                  p: ({ children }) => <p className="mb-4">{children}</p>,
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-display text-cast-iron mt-8 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-display text-cast-iron mt-6 mb-2">{children}</h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-cast-iron">{children}</strong>
                  ),
                }}
              >
                {blogContent.body}
              </ReactMarkdown>
            </div>

            {/* Story photos */}
            {blogContent.photos?.length > 0 && (
              <div className={`mt-6 gap-3 ${
                blogContent.photos.length === 1
                  ? 'grid grid-cols-1'
                  : blogContent.photos.length === 2
                    ? 'grid grid-cols-2'
                    : 'grid grid-cols-2 md:grid-cols-3'
              }`}>
                {blogContent.photos.map((url, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl overflow-hidden border border-stone/10 shadow-sm ${
                      blogContent.photos.length === 1 ? 'max-h-96' : 'aspect-square'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Divider between story and recipe */}
            <div className="mt-10 mb-2 flex items-center gap-4">
              <div className="flex-1 h-px bg-stone/20" />
              <span className="font-handwritten text-lg text-stone">The Recipe</span>
              <div className="flex-1 h-px bg-stone/20" />
            </div>
          </div>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-display text-cast-iron mb-5">Ingredients</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="flex items-baseline gap-2 py-2 border-b border-stone/10"
                >
                  <span className="font-body text-sunday-brown text-lg">
                    {ing.quantity && (
                      <span className="font-semibold">{ing.quantity} </span>
                    )}
                    {ing.unit && <span>{ing.unit} </span>}
                    {ing.ingredients?.name || ''}
                  </span>
                  {ing.notes && (
                    <span className="text-sm text-stone font-body">({ing.notes})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-display text-cast-iron mb-5">Instructions</h2>
            <ol className="space-y-5">
              {instructions.map((inst, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="w-9 h-9 rounded-full bg-sienna text-flour flex items-center justify-center
                    text-sm font-body font-semibold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="font-body text-sunday-brown text-lg pt-1 flex-1 leading-relaxed">
                    {inst.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div className="mb-10 bg-linen rounded-xl p-6 border border-stone/10">
            <h2 className="text-xl font-display text-cast-iron mb-2">Notes</h2>
            <p className="font-body text-sunday-brown text-lg leading-relaxed whitespace-pre-wrap">
              {recipe.notes}
            </p>
          </div>
        )}

        {/* Source attribution */}
        {recipe.source_url && (
          <div className="mb-8">
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-body text-sienna hover:text-sienna/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Original source
            </a>
          </div>
        )}

        {/* CTA: Save to My Family */}
        <div className="bg-flour rounded-2xl border border-stone/20 shadow-lg p-8 text-center mb-10">
          {savedSuccess ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-herb/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-herb" />
              </div>
              <p className="font-display text-xl text-cast-iron">Recipe saved to your family collection!</p>
            </div>
          ) : (
            <>
              <h3 className="font-display text-2xl text-cast-iron mb-2">
                Love this recipe?
              </h3>
              <p className="font-body text-sunday-brown/70 mb-6">
                Save it to your family collection and keep the tradition alive.
              </p>
              <button
                onClick={handleSaveToFamily}
                disabled={saving || alreadySaved}
                className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-8 py-4 text-lg
                  font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : alreadySaved ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <BookmarkPlus className="w-5 h-5" />
                )}
                {alreadySaved ? 'Saved to Your Family' : 'Save to My Family'}
              </button>
            </>
          )}
        </div>

        {/* Dietary labels */}
        {recipe.dietary_labels?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {recipe.dietary_labels.map((label) => (
              <span
                key={label}
                className="text-sm font-body px-3 py-1 rounded-full bg-herb/10 text-herb"
              >
                {label.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t border-stone/10 bg-linen/50">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <p className="font-handwritten text-xl text-sunday-brown/60 mb-2">
            Every family has a story worth saving.
          </p>
          <a
            href="/"
            className="font-display text-cast-iron hover:text-sienna transition-colors"
          >
            Sunday Dinner Memories
          </a>
        </div>
      </footer>
    </div>
  )
}
