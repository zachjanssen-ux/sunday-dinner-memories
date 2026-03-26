import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import useRecipePermissions from '../hooks/useRecipePermissions'
import { formatQuantity } from '../lib/utils'
import { AddToCookbookModal } from '../components/recipes/CookbookModal'
import AudioMemories from '../components/recipes/AudioMemories'
import PDFExportButton from '../components/pdf/PDFExportButton'
import StoryEditor from '../components/recipes/StoryEditor'
import StoryDisplay from '../components/recipes/StoryDisplay'
import PublicSharingToggle from '../components/recipes/PublicSharingToggle'
import Layout from '../components/layout/Layout'
import {
  ArrowLeft,
  Heart,
  Clock,
  Utensils,
  Edit3,
  Trash2,
  RefreshCw,
  Flag,
  BookOpen,
  PenLine,
  Loader2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const difficultyStyles = {
  easy: 'bg-herb/20 text-herb',
  medium: 'bg-butter/20 text-sunday-brown',
  advanced: 'bg-tomato/20 text-tomato',
}

const servingPresets = [0.5, 1, 2, 3]

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { recipes, toggleFavorite, deleteRecipe } = useRecipeStore()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [servingMultiplier, setServingMultiplier] = useState(1)
  const [customServings, setCustomServings] = useState('')
  const [showCookbookModal, setShowCookbookModal] = useState(false)
  const [audioMemories, setAudioMemories] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [showStoryEditor, setShowStoryEditor] = useState(false)

  const permissions = useRecipePermissions(recipe)

  // Try to get recipe from store first, then fetch
  useEffect(() => {
    const existing = recipes.find((r) => r.id === id)
    if (existing && existing.recipe_ingredients) {
      setRecipe(existing)
      setLoading(false)
    } else {
      fetchRecipe()
    }
    fetchAudioMemories()
  }, [id, recipes])

  const fetchRecipe = async () => {
    setLoading(true)
    // Use simpler query without nested ingredient join (causes 406 errors)
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        cooks ( id, name, bio, photo_url ),
        recipe_tags ( id, tag_id, tags ( id, name ) ),
        recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching recipe:', error)
      setLoading(false)
      return
    }

    if (!data) {
      console.error('Recipe not found')
      setLoading(false)
      return
    }

    // Check favorite status
    let isFavorited = false
    if (user) {
      const { data: fav } = await supabase
        .from('favorites')
        .select('id')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      isFavorited = !!fav
    }

    setRecipe({
      ...data,
      cook_name: data.cooks?.name || 'Unknown',
      cook_bio: data.cooks?.bio || '',
      cook_photo: data.cooks?.photo_url || '',
      is_favorited: isFavorited,
    })
    setLoading(false)
  }

  const fetchAudioMemories = async () => {
    const { data } = await supabase
      .from('audio_memories')
      .select('*')
      .eq('recipe_id', id)
      .order('created_at', { ascending: false })

    setAudioMemories(data || [])
  }

  const handleFavorite = async () => {
    if (!user || !recipe) return
    await toggleFavorite(recipe.id, user.id)
    setRecipe((prev) => prev ? { ...prev, is_favorited: !prev.is_favorited } : prev)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteRecipe(recipe.id)
      navigate('/dashboard')
    } catch (err) {
      console.error('Error deleting recipe:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleCustomServings = (val) => {
    setCustomServings(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0 && recipe?.servings) {
      setServingMultiplier(num / recipe.servings)
    }
  }

  const handlePreset = (mult) => {
    setServingMultiplier(mult)
    setCustomServings('')
  }

  const handleStorySave = (blogContent) => {
    setRecipe((prev) => ({ ...prev, blog_content: blogContent }))
    setShowStoryEditor(false)
  }

  const handlePublicUpdate = (updatedRecipe) => {
    setRecipe((prev) => ({ ...prev, ...updatedRecipe }))
  }

  const ingredients = (recipe?.recipe_ingredients || [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const instructions = (recipe?.instructions || [])
    .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))

  const tags = (recipe?.recipe_tags || []).map((rt) => rt.tags).filter(Boolean)

  const hasBlogContent = !!recipe?.blog_content?.body

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sienna animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!recipe) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-2xl font-display text-cast-iron mb-3">Recipe not found</h1>
          <p className="text-sunday-brown font-body mb-6">
            This recipe may have been removed or you don't have access.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sienna font-body font-semibold hover:text-sienna/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to recipes
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sienna font-body font-semibold hover:text-sienna/80 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to recipes
        </Link>

        {/* Hero photo */}
        {recipe.original_image_url ? (
          <div className="rounded-xl overflow-hidden mb-8 max-h-96">
            <img
              src={recipe.original_image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-xl bg-linen border border-stone/20 mb-8 h-48 flex items-center justify-center">
            <Utensils className="w-16 h-16 text-stone/30" />
          </div>
        )}

        {/* Title & cook */}
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-display text-cast-iron mb-2">
            {recipe.title}
          </h1>
          {recipe.cook_name && (
            <p className="font-handwritten text-xl text-sunday-brown/70">
              A recipe by {recipe.cook_name}
            </p>
          )}
          {recipe.description && (
            <p className="text-sunday-brown font-body mt-3">{recipe.description}</p>
          )}
        </div>

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
              {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Dietary labels */}
        {recipe.dietary_labels?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
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

        {/* Time, servings, actions */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-stone/20">
          {recipe.prep_time_min && (
            <div className="flex items-center gap-1.5 text-sunday-brown font-body">
              <Clock className="w-4 h-4 text-stone" />
              <span className="text-sm">Prep: {recipe.prep_time_min} min</span>
            </div>
          )}
          {recipe.cook_time_min && (
            <div className="flex items-center gap-1.5 text-sunday-brown font-body">
              <Clock className="w-4 h-4 text-stone" />
              <span className="text-sm">Cook: {recipe.cook_time_min} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1.5 text-sunday-brown font-body">
              <Utensils className="w-4 h-4 text-stone" />
              <span className="text-sm">{recipe.servings} servings</span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleFavorite}
              aria-label={recipe.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
              className="w-10 h-10 rounded-full bg-linen border border-stone/20 flex items-center justify-center
                hover:bg-flour transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${
                  recipe.is_favorited ? 'fill-tomato text-tomato' : 'text-stone'
                }`}
              />
            </button>
            <button
              onClick={() => setShowCookbookModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linen border border-stone/20
                text-sm font-body font-semibold text-sunday-brown hover:bg-flour transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Add to Cookbook
            </button>
            <PDFExportButton
              recipe={recipe}
              ingredients={ingredients}
              cookName={recipe.cook_name}
            />
          </div>
        </div>

        {/* Permission-gated action buttons */}
        {(permissions.canEdit || permissions.canDelete || permissions.canRescan || permissions.canFlag) && (
          <div className="flex flex-wrap gap-3 mb-8">
            {permissions.canEdit && (
              <Link
                to={`/recipes/${recipe.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sienna text-flour
                  text-sm font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Recipe
              </Link>
            )}
            {permissions.canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-flour border border-tomato/30
                  text-sm font-body font-semibold text-tomato hover:bg-tomato/10 transition-colors
                  disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            )}
            {permissions.canRescan && (
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-flour border border-stone/30
                text-sm font-body font-semibold text-sunday-brown hover:bg-linen transition-colors">
                <RefreshCw className="w-4 h-4" />
                Rescan
              </button>
            )}
            {permissions.canFlag && (
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-flour border border-stone/30
                text-sm font-body font-semibold text-sunday-brown hover:bg-linen transition-colors">
                <Flag className="w-4 h-4" />
                Flag Issue
              </button>
            )}
          </div>
        )}

        {/* Public Sharing Toggle — contributor only */}
        {permissions.isContributor && (
          <PublicSharingToggle recipe={recipe} onUpdate={handlePublicUpdate} />
        )}

        {/* Story Display — shown when blog_content exists */}
        {hasBlogContent && !showStoryEditor && (
          <StoryDisplay blogContent={recipe.blog_content} />
        )}

        {/* Story Editor */}
        {showStoryEditor && (
          <StoryEditor
            recipe={recipe}
            onSave={handleStorySave}
            onCancel={() => setShowStoryEditor(false)}
          />
        )}

        {/* Add/Edit Story button — contributor only */}
        {permissions.isContributor && !showStoryEditor && (
          <div className="mb-8">
            <button
              onClick={() => setShowStoryEditor(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-stone/40
                text-sm font-body font-semibold text-stone hover:text-sunday-brown hover:bg-linen transition-colors"
            >
              <PenLine className="w-4 h-4" />
              {hasBlogContent ? 'Edit Story' : 'Add a Story'}
            </button>
          </div>
        )}

        {/* Servings scaling */}
        {recipe.servings && ingredients.length > 0 && (
          <div className="bg-linen rounded-xl p-4 border border-stone/20 mb-8">
            <p className="text-sm font-body font-semibold text-sunday-brown mb-2">
              Scale servings
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {servingPresets.map((mult) => (
                <button
                  key={mult}
                  onClick={() => handlePreset(mult)}
                  className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors border ${
                    servingMultiplier === mult && !customServings
                      ? 'bg-sienna text-flour border-sienna'
                      : 'bg-flour text-sunday-brown border-stone/30 hover:bg-linen'
                  }`}
                >
                  {mult === 0.5 ? '\u00BD' : mult}\u00D7
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={customServings}
                  onChange={(e) => handleCustomServings(e.target.value)}
                  placeholder="Custom"
                  min="1"
                  className="w-20 bg-flour border border-stone/30 rounded-lg px-3 py-2 text-sm font-body text-sunday-brown
                    focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
                />
                <span className="text-sm font-body text-stone">servings</span>
              </div>
            </div>
          </div>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-display text-cast-iron mb-4">Ingredients</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {ingredients.map((ing) => {
                const scaledQty = ing.quantity_numeric
                  ? ing.quantity_numeric * servingMultiplier
                  : null

                return (
                  <div
                    key={ing.id}
                    className="flex items-baseline gap-2 py-1.5 border-b border-stone/10"
                  >
                    <span className="font-body text-sunday-brown">
                      {scaledQty !== null && (
                        <span className="font-semibold">{formatQuantity(scaledQty)} </span>
                      )}
                      {!scaledQty && ing.quantity && (
                        <span className="font-semibold">{ing.quantity} </span>
                      )}
                      {ing.unit && <span>{ing.unit} </span>}
                      {ing.ingredients?.name || ''}
                    </span>
                    {ing.notes && (
                      <span className="text-sm text-stone font-body">({ing.notes})</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-display text-cast-iron mb-4">Instructions</h2>
            <ol className="space-y-4">
              {instructions.map((inst, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-sienna text-flour flex items-center justify-center
                    text-sm font-body font-semibold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="font-body text-sunday-brown pt-1 flex-1">
                    {inst.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div className="mb-8 bg-linen rounded-xl p-6 border border-stone/20">
            <h2 className="text-xl font-display text-cast-iron mb-2">Notes</h2>
            <p className="font-body text-sunday-brown whitespace-pre-wrap">{recipe.notes}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full bg-honey/20 text-sunday-brown text-sm font-body"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Audio Memories */}
        <div className="mb-8">
          <AudioMemories memories={audioMemories} />
        </div>
      </div>

      {showCookbookModal && (
        <AddToCookbookModal
          recipeId={recipe.id}
          onClose={() => setShowCookbookModal(false)}
        />
      )}
    </Layout>
  )
}
