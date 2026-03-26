import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, RotateCcw, PenLine, Plus, Trash2, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import useRecipeStore from '../../store/recipeStore'
import useAuthStore from '../../store/authStore'

export default function ScanReview({ data, imageDataUrl, onRescan, source = 'scanned', existingRecipeId }) {
  const navigate = useNavigate()
  const { addRecipe, updateRecipe } = useRecipeStore()
  const { currentMember, currentFamily } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Editable form state from AI extraction
  const [title, setTitle] = useState(data?.title || '')
  const [description, setDescription] = useState(data?.description || '')
  const [originalCook, setOriginalCook] = useState(data?.original_cook || '')
  const [cuisine, setCuisine] = useState(data?.cuisine || '')
  const [difficulty, setDifficulty] = useState(data?.difficulty || 'medium')
  const [dietaryLabels, setDietaryLabels] = useState((data?.dietary_labels || []).join(', '))
  const [prepTime, setPrepTime] = useState(data?.prep_time_min ?? '')
  const [cookTime, setCookTime] = useState(data?.cook_time_min ?? '')
  const [servings, setServings] = useState(data?.servings ?? '')
  const [notes, setNotes] = useState(data?.notes || '')
  const [ingredients, setIngredients] = useState(
    data?.ingredients?.length
      ? data.ingredients.map((ing) => ({
          name: ing.name || '',
          quantity: ing.quantity || '',
          unit: ing.unit || '',
          notes: ing.notes || '',
        }))
      : [{ name: '', quantity: '', unit: '', notes: '' }]
  )
  const [instructions, setInstructions] = useState(
    data?.instructions?.length
      ? data.instructions.map((inst) => inst.text || '')
      : ['']
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasUncertain = (text) => text?.includes('[?]')

  const highlightClass = (value) =>
    hasUncertain(value) ? 'ring-2 ring-butter' : ''

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '', notes: '' }])
  }

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  // Instruction handlers
  const addInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const removeInstruction = (index) => {
    setInstructions(instructions.filter((_, i) => i !== index))
  }

  const updateInstruction = (index, value) => {
    const updated = [...instructions]
    updated[index] = value
    setInstructions(updated)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Recipe needs a title.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Build instructions as JSONB array (stored on recipe, not a separate table)
      const instructionsJson = instructions
        .filter((text) => text.trim())
        .map((text, idx) => ({
          step: idx + 1,
          text: text.trim(),
        }))

      const recipeData = {
        title: title.trim(),
        description: description.trim() || null,
        cuisine: cuisine.trim() || null,
        difficulty: difficulty || null,
        dietary_labels: dietaryLabels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        prep_time_min: prepTime ? parseInt(prepTime, 10) : null,
        cook_time_min: cookTime ? parseInt(cookTime, 10) : null,
        servings: servings ? parseInt(servings, 10) : null,
        notes: notes.trim() || null,
        instructions: instructionsJson.length > 0 ? instructionsJson : null,
        source: source,
        scan_status: 'reviewed',
        family_id: currentFamily?.id,
        contributed_by: currentMember?.id,
      }

      const ingredientRows = ingredients
        .filter((ing) => ing.name.trim())
        .map((ing) => ({
          quantity: ing.quantity || '',
          unit: ing.unit || '',
          notes: ing.notes || '',
          // ingredient_id will be null for now -- ingredient lookup can happen server-side later
          ingredient_id: null,
        }))

      if (existingRecipeId) {
        await updateRecipe(existingRecipeId, recipeData, ingredientRows, null, [])
      } else {
        await addRecipe(recipeData, ingredientRows, null, [])
      }

      navigate('/recipes')
    } catch (err) {
      console.error('Save error:', err)
      setError('Could not save the recipe. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const uncertainCount = [
    title, description, originalCook, cuisine, notes,
    ...ingredients.map((i) => `${i.name} ${i.quantity} ${i.unit} ${i.notes}`),
    ...instructions,
  ].filter((v) => hasUncertain(v)).length

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display text-cast-iron">Review Extracted Recipe</h2>
          <p className="text-stone font-body text-sm mt-1">
            Check the details below and fix anything that looks off before saving.
          </p>
        </div>
        <div className="flex gap-2">
          {onRescan && (
            <button
              onClick={onRescan}
              className="flex items-center gap-2 bg-linen text-sunday-brown rounded-lg px-4 py-2 font-semibold font-body text-sm border border-stone/20 hover:bg-stone/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Rescan
            </button>
          )}
          <button
            onClick={() => navigate('/recipes/new', {
              state: {
                prefill: {
                  title, description, cuisine, difficulty,
                  dietary_labels: dietaryLabels.split(',').map((l) => l.trim()).filter(Boolean),
                  prep_time_min: prepTime ? parseInt(prepTime, 10) : null,
                  cook_time_min: cookTime ? parseInt(cookTime, 10) : null,
                  servings: servings ? parseInt(servings, 10) : null,
                  notes,
                  ingredients,
                  instructions: instructions.map((text, i) => ({ step: i + 1, text })),
                },
              },
            })}
            className="flex items-center gap-2 bg-linen text-sunday-brown rounded-lg px-4 py-2 font-semibold font-body text-sm border border-stone/20 hover:bg-stone/10 transition-colors"
          >
            <PenLine className="w-4 h-4" />
            Edit Manually
          </button>
        </div>
      </div>

      {/* Uncertain fields warning */}
      {uncertainCount > 0 && (
        <div className="bg-butter/20 border border-butter rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-honey flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-cast-iron font-body font-semibold text-sm">
              {uncertainCount} field{uncertainCount > 1 ? 's' : ''} may need review
            </p>
            <p className="text-sunday-brown font-body text-sm">
              Fields highlighted in yellow contain [?] — the handwriting was hard to read. Double-check those.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Original image (if available) */}
        {imageDataUrl && (
          <div className="lg:w-1/3">
            <div className="sticky top-4">
              <p className="text-stone font-body text-sm mb-2">Original</p>
              <div className="rounded-xl overflow-hidden shadow-sm border border-stone/20">
                <img src={imageDataUrl} alt="Original recipe" className="w-full h-auto" />
              </div>
            </div>
          </div>
        )}

        {/* Right: Editable form */}
        <div className={imageDataUrl ? 'lg:w-2/3' : 'w-full'}>
          <div className="bg-linen rounded-xl p-6 shadow-sm border border-stone/20 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50 ${highlightClass(title)}`}
                placeholder="What's this recipe called?"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={`w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50 resize-none ${highlightClass(description)}`}
                placeholder="A short description of the dish"
              />
            </div>

            {/* Row: Cook, Cuisine, Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                  Original Cook
                </label>
                <input
                  type="text"
                  value={originalCook}
                  onChange={(e) => setOriginalCook(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50 ${highlightClass(originalCook)}`}
                  placeholder="Grandma Rose"
                />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                  Cuisine
                </label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50 ${highlightClass(cuisine)}`}
                  placeholder="Italian, Southern, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Row: Prep, Cook, Servings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50"
                  placeholder="15"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50"
                  placeholder="30"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                  Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50"
                  placeholder="4"
                  min="1"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-body font-semibold text-cast-iron">
                  Ingredients
                </label>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-1 text-sienna font-body text-sm hover:text-sienna/80 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      className={`w-20 px-3 py-2 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body text-sm focus:outline-none focus:ring-2 focus:ring-sienna/50 ${highlightClass(ing.quantity)}`}
                      placeholder="Qty"
                    />
                    <input
                      type="text"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className={`w-20 px-3 py-2 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body text-sm focus:outline-none focus:ring-2 focus:ring-sienna/50 ${highlightClass(ing.unit)}`}
                      placeholder="Unit"
                    />
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body text-sm focus:outline-none focus:ring-2 focus:ring-sienna/50 ${highlightClass(ing.name)}`}
                      placeholder="Ingredient"
                    />
                    <input
                      type="text"
                      value={ing.notes}
                      onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                      className={`w-28 px-3 py-2 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body text-sm focus:outline-none focus:ring-2 focus:ring-sienna/50 hidden sm:block ${highlightClass(ing.notes)}`}
                      placeholder="Notes"
                    />
                    {ingredients.length > 1 && (
                      <button
                        onClick={() => removeIngredient(index)}
                        className="p-2 text-tomato/60 hover:text-tomato transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-body font-semibold text-cast-iron">
                  Instructions
                </label>
                <button
                  onClick={addInstruction}
                  className="flex items-center gap-1 text-sienna font-body text-sm hover:text-sienna/80 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Step
                </button>
              </div>
              <div className="space-y-2">
                {instructions.map((text, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="w-8 h-10 flex items-center justify-center text-stone font-body text-sm font-semibold flex-shrink-0">
                      {index + 1}.
                    </span>
                    <textarea
                      value={text}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      rows={2}
                      className={`flex-1 px-3 py-2 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body text-sm focus:outline-none focus:ring-2 focus:ring-sienna/50 resize-none ${highlightClass(text)}`}
                      placeholder={`Step ${index + 1}`}
                    />
                    {instructions.length > 1 && (
                      <button
                        onClick={() => removeInstruction(index)}
                        className="p-2 text-tomato/60 hover:text-tomato transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-stone font-body text-sm hover:text-sunday-brown transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide' : 'Show'} additional fields
            </button>

            {showAdvanced && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                    Dietary Labels
                  </label>
                  <input
                    type="text"
                    value={dietaryLabels}
                    onChange={(e) => setDietaryLabels(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50"
                    placeholder="vegetarian, gluten-free (comma-separated)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50 resize-none ${highlightClass(notes)}`}
                    placeholder="Any extra notes about this recipe"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-tomato/10 border border-tomato/30 rounded-lg px-4 py-3 text-tomato font-body text-sm">
                {error}
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3 font-semibold font-body shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Recipe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
