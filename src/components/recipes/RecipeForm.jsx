import { useState, useEffect, useRef } from 'react'
import useAuthStore from '../../store/authStore'
import useRecipeStore from '../../store/recipeStore'
import { parseQuantity } from '../../lib/utils'
import { compressImage } from '../../lib/imageUtils'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import {
  Plus,
  Trash2,
  GripVertical,
  X,
  ChevronDown,
  Loader2,
  Upload,
  Camera,
  Video,
} from 'lucide-react'

const categoryOptions = [
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'main', label: 'Main Course' },
  { value: 'side', label: 'Side Dish' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Drink' },
  { value: 'snack', label: 'Snack' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'other', label: 'Other' },
]

const cuisineOptions = [
  { value: 'american', label: 'American' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'thai', label: 'Thai' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'indian', label: 'Indian' },
  { value: 'french', label: 'French' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'southern', label: 'Southern' },
  { value: 'cajun', label: 'Cajun' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'greek', label: 'Greek' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'african', label: 'African' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'british', label: 'British' },
  { value: 'german', label: 'German' },
  { value: 'other', label: 'Other' },
]

const unitOptions = [
  { value: '', label: '—' },
  { value: 'cup', label: 'cup' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'piece', label: 'piece' },
  { value: 'pinch', label: 'pinch' },
  { value: 'to taste', label: 'to taste' },
]

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'nut_free', label: 'Nut Free' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'whole30', label: 'Whole30' },
]

function NewCookModal({ onSave, onClose, familyId }) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({ name: name.trim(), bio: bio.trim(), family_id: familyId })
      onClose()
    } catch (err) {
      console.error('Error adding cook:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-cast-iron/50 flex items-center justify-center z-50 p-4">
      <div className="bg-flour rounded-xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-cast-iron">Add New Cook</h3>
          <button onClick={onClose} className="text-stone hover:text-sunday-brown">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grandma Rose"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="The queen of Sunday dinners..."
              rows={2}
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-body font-semibold text-sunday-brown border border-stone/30 hover:bg-linen"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="px-4 py-2 rounded-lg text-sm font-body font-semibold bg-sienna text-flour shadow-md
                hover:bg-sienna/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Cook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TagInput({ selectedTagIds, onChange, familyId }) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const ref = useRef(null)
  const tags = useRecipeStore((s) => s.tags)
  const addTag = useRecipeStore((s) => s.addTag)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id))
  const filtered = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) &&
      !selectedTagIds.includes(t.id)
  )
  const canCreate =
    query.trim() &&
    !tags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase())

  const handleSelect = (tagId) => {
    onChange([...selectedTagIds, tagId])
    setQuery('')
    setShowDropdown(false)
  }

  const handleCreate = async () => {
    const newTag = await addTag({ name: query.trim(), family_id: familyId })
    if (newTag) {
      onChange([...selectedTagIds, newTag.id])
    }
    setQuery('')
    setShowDropdown(false)
  }

  const handleRemove = (tagId) => {
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  return (
    <div ref={ref}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-honey/20 text-sunday-brown text-sm font-body"
          >
            {tag.name}
            <button onClick={() => handleRemove(tag.id)}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search or create tags..."
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
            focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
        />
        {showDropdown && (filtered.length > 0 || canCreate) && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-flour border border-stone/20 rounded-lg shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
            {filtered.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleSelect(tag.id)}
                className="w-full text-left px-4 py-2 text-sm font-body text-sunday-brown hover:bg-linen"
              >
                {tag.name}
              </button>
            ))}
            {canCreate && (
              <button
                onClick={handleCreate}
                className="w-full text-left px-4 py-2 text-sm font-body text-sienna hover:bg-linen flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Create "{query.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecipeForm({ recipe, onSave, onCancel }) {
  const { currentMember, currentFamily } = useAuthStore()
  const { cooks, addCook } = useRecipeStore()
  const [showNewCook, setShowNewCook] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState(recipe?.title || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [originalCookId, setOriginalCookId] = useState(recipe?.original_cook_id || '')
  const [category, setCategory] = useState(recipe?.category || '')
  const [cuisine, setCuisine] = useState(recipe?.cuisine || '')
  const [difficulty, setDifficulty] = useState(recipe?.difficulty || 'easy')
  const [dietaryLabels, setDietaryLabels] = useState(recipe?.dietary_labels || [])
  const [prepTime, setPrepTime] = useState(recipe?.prep_time_min || '')
  const [cookTime, setCookTime] = useState(recipe?.cook_time_min || '')
  const [servings, setServings] = useState(recipe?.servings || '')
  const [notes, setNotes] = useState(recipe?.notes || '')
  const [videoUrl, setVideoUrl] = useState(recipe?.video_url || '')
  const [photos, setPhotos] = useState(recipe?.photos || [])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photoInputRef = useRef(null)
  const [tagIds, setTagIds] = useState(
    (recipe?.recipe_tags || []).map((rt) => rt.tag_id || rt.tags?.id).filter(Boolean)
  )

  const [ingredients, setIngredients] = useState(
    recipe?.recipe_ingredients?.length > 0
      ? recipe.recipe_ingredients
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((ing) => ({
            ingredient_name: ing.ingredients?.name || '',
            ingredient_id: ing.ingredient_id || null,
            quantity: ing.quantity || '',
            unit: ing.unit || '',
            notes: ing.notes || '',
          }))
      : [{ ingredient_name: '', ingredient_id: null, quantity: '', unit: '', notes: '' }]
  )

  // Instructions are stored as JSONB on the recipe: [{step: 1, text: "..."}]
  const [instructions, setInstructions] = useState(
    recipe?.instructions?.length > 0
      ? recipe.instructions
          .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
          .map((inst) => ({ text: inst.text || '' }))
      : [{ text: '' }]
  )

  // Drag state for ingredients
  const [dragIdx, setDragIdx] = useState(null)

  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient_name: '', ingredient_id: null, quantity: '', unit: '', notes: '' }])
  }

  const removeIngredient = (idx) => {
    if (ingredients.length <= 1) return
    setIngredients(ingredients.filter((_, i) => i !== idx))
  }

  const updateIngredient = (idx, field, value) => {
    setIngredients(
      ingredients.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    )
  }

  const addInstruction = () => {
    setInstructions([...instructions, { text: '' }])
  }

  const removeInstruction = (idx) => {
    if (instructions.length <= 1) return
    setInstructions(instructions.filter((_, i) => i !== idx))
  }

  const updateInstruction = (idx, value) => {
    setInstructions(
      instructions.map((inst, i) =>
        i === idx ? { ...inst, text: value } : inst
      )
    )
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploadingPhotos(true)
    try {
      const newUrls = []
      for (const file of files) {
        const compressed = await compressImage(file)
        const ext = compressed.name.split('.').pop() || 'jpg'
        const path = `temp/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('recipe-photos')
          .upload(path, compressed, { contentType: compressed.type })
        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`)
          continue
        }
        const { data: urlData } = supabase.storage.from('recipe-photos').getPublicUrl(path)
        if (urlData?.publicUrl) newUrls.push(urlData.publicUrl)
      }
      if (newUrls.length > 0) {
        setPhotos((prev) => [...prev, ...newUrls])
        toast.success(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} added`)
      }
    } catch (err) {
      console.error('Photo upload error:', err)
      toast.error('Failed to upload photos')
    } finally {
      setUploadingPhotos(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const newIngredients = [...ingredients]
    const [moved] = newIngredients.splice(dragIdx, 1)
    newIngredients.splice(idx, 0, moved)
    setIngredients(newIngredients)
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  const toggleDietary = (val) => {
    if (dietaryLabels.includes(val)) {
      setDietaryLabels(dietaryLabels.filter((d) => d !== val))
    } else {
      setDietaryLabels([...dietaryLabels, val])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Recipe title is required.')
      return
    }

    setSaving(true)
    try {
      // Build instructions JSONB array
      const instructionsJson = instructions
        .filter((inst) => inst.text.trim())
        .map((inst, idx) => ({
          step: idx + 1,
          text: inst.text.trim(),
        }))

      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        original_cook_id: originalCookId || null,
        category: category || null,
        cuisine: cuisine || null,
        difficulty: difficulty || 'easy',
        dietary_labels: dietaryLabels,
        prep_time_min: prepTime ? parseInt(prepTime, 10) : null,
        cook_time_min: cookTime ? parseInt(cookTime, 10) : null,
        servings: servings ? parseInt(servings, 10) : null,
        notes: notes.trim(),
        video_url: videoUrl.trim() || null,
        photos: photos.length > 0 ? photos : [],
        instructions: instructionsJson.length > 0 ? instructionsJson : null,
        family_id: currentFamily.id,
        contributed_by: currentMember.id,
        source: recipe?.source || 'manual',
      }

      const parsedIngredients = ingredients
        .filter((ing) => ing.ingredient_name.trim())
        .map((ing) => ({
          ingredient_id: ing.ingredient_id || null,
          quantity: ing.quantity || '',
          quantity_numeric: parseQuantity(ing.quantity),
          unit: ing.unit || '',
          notes: ing.notes || '',
        }))

      // Instructions are passed as part of recipeData.instructions (JSONB on recipes table)
      await onSave(recipeData, parsedIngredients, null, tagIds)
    } catch (err) {
      console.error('Error saving recipe:', err)
      setError(err.message || 'Failed to save recipe. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleNewCookSave = async (cookData) => {
    const newCook = await addCook(cookData)
    if (newCook) {
      setOriginalCookId(newCook.id)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-tomato/10 border border-tomato/30 text-tomato rounded-lg px-4 py-3 text-sm font-body">
            {error}
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Recipe Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grandma's Famous Cornbread"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown text-lg
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A quick description of this recipe..."
              rows={2}
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
            />
          </div>
        </div>

        {/* Original Cook */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
            Original Cook
          </label>
          <div className="flex gap-2">
            <select
              value={originalCookId}
              onChange={(e) => setOriginalCookId(e.target.value)}
              className="flex-1 bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none appearance-none"
            >
              <option value="">Select a cook...</option>
              {cooks.map((cook) => (
                <option key={cook.id} value={cook.id}>
                  {cook.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCook(true)}
              className="px-4 py-3 rounded-lg border border-stone/30 text-sm font-body font-semibold text-sienna
                hover:bg-linen transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Cook
            </button>
          </div>
        </div>

        {/* Category, Cuisine, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none appearance-none"
            >
              <option value="">Select...</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Cuisine
            </label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none appearance-none"
            >
              <option value="">Select...</option>
              {cuisineOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Difficulty
            </label>
            <div className="flex gap-2">
              {['easy', 'medium', 'advanced'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-3 rounded-lg text-sm font-body font-semibold transition-colors border ${
                    difficulty === d
                      ? d === 'easy'
                        ? 'bg-herb/20 text-herb border-herb/30'
                        : d === 'medium'
                        ? 'bg-butter/20 text-sunday-brown border-butter/30'
                        : 'bg-tomato/20 text-tomato border-tomato/30'
                      : 'bg-flour text-stone border-stone/30 hover:bg-linen'
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dietary Labels */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-2">
            Dietary Labels
          </label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((opt) => (
              <label
                key={opt.value}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm font-body transition-colors ${
                  dietaryLabels.includes(opt.value)
                    ? 'bg-herb/10 border-herb/30 text-herb'
                    : 'bg-flour border-stone/30 text-sunday-brown hover:bg-linen'
                }`}
              >
                <input
                  type="checkbox"
                  checked={dietaryLabels.includes(opt.value)}
                  onChange={() => toggleDietary(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Times & Servings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Prep Time (min)
            </label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              min="0"
              placeholder="15"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Cook Time (min)
            </label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              min="0"
              placeholder="30"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Servings
            </label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              min="1"
              placeholder="4"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-2">
            Ingredients
          </label>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 ${
                  dragIdx === idx ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="w-4 h-4 text-stone/40 cursor-grab shrink-0" />
                <input
                  type="text"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                  placeholder="1 1/2"
                  className="w-20 bg-flour border border-stone/30 rounded-lg px-3 py-2.5 text-sm font-body text-sunday-brown
                    focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  className="w-24 bg-flour border border-stone/30 rounded-lg px-2 py-2.5 text-sm font-body text-sunday-brown
                    focus:ring-2 focus:ring-sienna/50 focus:outline-none appearance-none"
                >
                  {unitOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={ing.ingredient_name}
                  onChange={(e) =>
                    updateIngredient(idx, 'ingredient_name', e.target.value)
                  }
                  placeholder="Ingredient name"
                  className="flex-1 bg-flour border border-stone/30 rounded-lg px-3 py-2.5 text-sm font-body text-sunday-brown
                    focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
                />
                <input
                  type="text"
                  value={ing.notes}
                  onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}
                  placeholder="Notes"
                  className="w-28 bg-flour border border-stone/30 rounded-lg px-3 py-2.5 text-sm font-body text-sunday-brown
                    focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 hidden sm:block"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="text-stone hover:text-tomato transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 inline-flex items-center gap-1 text-sm font-body font-semibold text-sienna hover:text-sienna/80"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-2">
            Instructions
          </label>
          <div className="space-y-3">
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="w-8 h-10 flex items-center justify-center text-sm font-body font-semibold text-stone shrink-0">
                  {idx + 1}.
                </span>
                <textarea
                  value={inst.text}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}...`}
                  rows={2}
                  className="flex-1 bg-flour border border-stone/30 rounded-lg px-4 py-2.5 text-sm font-body text-sunday-brown
                    focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(idx)}
                  className="text-stone hover:text-tomato transition-colors shrink-0 mt-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addInstruction}
            className="mt-2 inline-flex items-center gap-1 text-sm font-body font-semibold text-sienna hover:text-sienna/80"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra notes, tips, or family stories about this recipe..."
            rows={3}
            className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
              focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-2">
            Photos
          </label>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {photos.map((url, idx) => (
                <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-stone/20">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-cast-iron/70 text-flour
                      flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-tomato"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone/30
            text-sm font-body font-semibold text-sienna hover:bg-linen transition-colors cursor-pointer">
            {uploadingPhotos ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploadingPhotos}
              className="sr-only"
            />
          </label>
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
            Video URL
          </label>
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-stone shrink-0" />
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube or Vimeo URL..."
              className="flex-1 bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>
          <p className="text-xs font-body text-stone mt-1">
            Paste a YouTube or Vimeo link to embed a video with this recipe
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
            Tags
          </label>
          <TagInput
            selectedTagIds={tagIds}
            onChange={setTagIds}
            familyId={currentFamily.id}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-stone/20">
          <button
            type="submit"
            disabled={saving}
            className="bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md
              hover:bg-sienna/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {recipe ? 'Save Changes' : 'Save Recipe'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-linen text-sunday-brown border border-stone rounded-lg px-6 py-3 font-body font-semibold
              hover:bg-linen/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {showNewCook && (
        <NewCookModal
          onSave={handleNewCookSave}
          onClose={() => setShowNewCook(false)}
          familyId={currentFamily.id}
        />
      )}
    </>
  )
}
