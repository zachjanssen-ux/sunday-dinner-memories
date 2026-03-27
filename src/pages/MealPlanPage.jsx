import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, parseISO, startOfWeek, eachDayOfInterval, isEqual } from 'date-fns'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import useMealPlanStore from '../store/mealPlanStore'
import useShoppingListStore from '../store/shoppingListStore'
import Layout from '../components/layout/Layout'
import PlanGate from '../components/guards/PlanGate'
import RecipePicker from '../components/mealplan/RecipePicker'
import MealSlotCell from '../components/mealplan/MealSlotCell'
import {
  CalendarDays,
  Plus,
  Copy,
  Trash2,
  ShoppingCart,
  Loader2,
  ChevronDown,
  X,
} from 'lucide-react'

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function MealPlanPage() {
  const navigate = useNavigate()
  const { currentFamily, currentMember, user } = useAuthStore()
  const { recipes, fetchRecipes } = useRecipeStore()
  const {
    plans,
    currentPlan,
    planItems,
    loading,
    fetchPlans,
    fetchPlan,
    createPlan,
    deletePlan,
    addItem,
    removeItem,
    updateItem,
    duplicatePlan,
    clearCurrentPlan,
  } = useMealPlanStore()
  const { generateFromPlan, loading: shoppingLoading } = useShoppingListStore()

  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null) // { date, slot }
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [newPlanStart, setNewPlanStart] = useState('')
  const [newPlanEnd, setNewPlanEnd] = useState('')
  const [generating, setGenerating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Load data
  useEffect(() => {
    if (currentFamily?.id) {
      fetchPlans(currentFamily.id)
      if (user?.id) {
        fetchRecipes(currentFamily.id, user.id)
      }
    }
  }, [currentFamily?.id, user?.id])

  // Auto-select first plan if none selected
  useEffect(() => {
    if (!currentPlan && plans.length > 0) {
      fetchPlan(plans[0].id)
    }
  }, [plans])

  // Compute days for the current plan
  const planDays = useMemo(() => {
    if (!currentPlan?.start_date || !currentPlan?.end_date) return []
    try {
      return eachDayOfInterval({
        start: parseISO(currentPlan.start_date),
        end: parseISO(currentPlan.end_date),
      })
    } catch {
      return []
    }
  }, [currentPlan?.start_date, currentPlan?.end_date])

  // Group items by date+slot
  const itemsByDateSlot = useMemo(() => {
    const map = {}
    for (const item of planItems) {
      const key = `${item.date}__${item.meal_slot}`
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [planItems])

  // Default new plan dates
  const openCreateModal = () => {
    const nextMonday = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 })
    setNewPlanTitle('')
    setNewPlanStart(format(nextMonday, 'yyyy-MM-dd'))
    setNewPlanEnd(format(addDays(nextMonday, 6), 'yyyy-MM-dd'))
    setShowCreateModal(true)
  }

  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim() || !newPlanStart || !newPlanEnd) return
    try {
      const plan = await createPlan({
        family_id: currentFamily.id,
        title: newPlanTitle.trim(),
        start_date: newPlanStart,
        end_date: newPlanEnd,
      })
      setShowCreateModal(false)
      fetchPlan(plan.id)
    } catch (err) {
      console.error('Error creating plan:', err)
    }
  }

  const handleSelectPlan = (e) => {
    const planId = e.target.value
    if (planId === '__new__') {
      openCreateModal()
      return
    }
    if (planId) {
      fetchPlan(planId)
    } else {
      clearCurrentPlan()
    }
  }

  const handleAddRecipeClick = (date, slot) => {
    setPickerTarget({ date: format(date, 'yyyy-MM-dd'), slot })
    setShowPicker(true)
  }

  const handleRecipeSelected = async (recipe) => {
    if (!pickerTarget || !currentPlan) return
    try {
      await addItem({
        meal_plan_id: currentPlan.id,
        recipe_id: recipe.id,
        date: pickerTarget.date,
        meal_slot: pickerTarget.slot,
        servings_multiplier: 1,
        notes: '',
        added_by: currentMember?.id || null,
      })
      setShowPicker(false)
      setPickerTarget(null)
    } catch (err) {
      console.error('Error adding item:', err)
    }
  }

  const handleDuplicate = async () => {
    if (!currentPlan) return
    try {
      const newPlan = await duplicatePlan(currentPlan.id, currentFamily.id)
      fetchPlan(newPlan.id)
    } catch (err) {
      console.error('Error duplicating plan:', err)
    }
  }

  const handleDelete = async () => {
    if (!currentPlan) return
    try {
      await deletePlan(currentPlan.id)
      setDeleteConfirm(false)
    } catch (err) {
      console.error('Error deleting plan:', err)
    }
  }

  const handleGenerateShoppingList = async () => {
    if (!currentPlan) return
    setGenerating(true)
    try {
      const list = await generateFromPlan(
        currentPlan.id,
        currentFamily.id,
        currentPlan.title
      )
      navigate(`/shopping-list/${list.id}`)
    } catch (err) {
      console.error('Error generating shopping list:', err)
    } finally {
      setGenerating(false)
    }
  }

  // Update end date when start date changes
  const handleStartDateChange = (e) => {
    const start = e.target.value
    setNewPlanStart(start)
    if (start) {
      setNewPlanEnd(format(addDays(parseISO(start), 6), 'yyyy-MM-dd'))
    }
  }

  if (!currentFamily) {
    return (
      <Layout>
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-stone mx-auto mb-4" />
          <p className="text-sunday-brown font-body">Join a family to start meal planning.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PlanGate feature="mealPlan">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display text-cast-iron">Meal Planner</h1>
            <p className="text-stone font-body text-sm mt-1">
              Plan your week and generate a shopping list
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Plan selector */}
            <div className="relative">
              <select
                value={currentPlan?.id || ''}
                onChange={handleSelectPlan}
                className="appearance-none bg-flour border border-stone/20 rounded-lg px-4 py-2 pr-8 font-body text-sm text-sunday-brown focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50 cursor-pointer"
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
                {isActive && <option value="__new__">+ Create New Plan</option>}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
            </div>

            {isActive && (
              <button
                onClick={openCreateModal}
                className="bg-sienna text-flour rounded-lg px-4 py-2 font-body text-sm font-semibold hover:bg-sienna/90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Plan</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-sienna animate-spin mx-auto mb-4" />
            <p className="text-sunday-brown font-body">Loading meal plan...</p>
          </div>
        ) : !currentPlan ? (
          /* Empty State */
          <div className="text-center py-16 bg-linen/50 rounded-2xl">
            <CalendarDays className="w-16 h-16 text-stone/50 mx-auto mb-4" />
            <h2 className="text-xl font-display text-cast-iron mb-2">No meal plan selected</h2>
            <p className="text-sunday-brown font-body mb-6 max-w-md mx-auto">
              {plans.length > 0
                ? 'Select a plan from the dropdown, or create a new one to get started.'
                : "You haven't created any meal plans yet. Start planning your week and make grocery shopping a breeze."}
            </p>
            {isActive && (
              <button
                onClick={openCreateModal}
                className="bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold hover:bg-sienna/90 transition-colors shadow-md"
              >
                Create Your First Plan
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Plan Actions */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-sm font-body text-stone">
                {currentPlan.start_date && currentPlan.end_date
                  ? `${format(parseISO(currentPlan.start_date), 'MMM d')} — ${format(parseISO(currentPlan.end_date), 'MMM d, yyyy')}`
                  : ''}
              </span>
              <div className="flex-1" />
              {isActive && (
                <>
                  <button
                    onClick={handleDuplicate}
                    className="text-sm text-stone hover:text-sunday-brown flex items-center gap-1 font-body transition-colors px-2 py-1 rounded hover:bg-linen"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="text-sm text-stone hover:text-tomato flex items-center gap-1 font-body transition-colors px-2 py-1 rounded hover:bg-tomato/5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Calendar Grid */}
            <div className="bg-flour rounded-xl shadow-sm border border-stone/10 overflow-x-auto mb-6">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-body font-semibold text-stone uppercase tracking-wider border-b border-stone/10 w-20">
                      Meal
                    </th>
                    {planDays.map((day) => (
                      <th
                        key={day.toISOString()}
                        className="p-3 text-center border-b border-stone/10 min-w-[120px]"
                      >
                        <div className="text-xs font-body font-semibold text-stone uppercase tracking-wider">
                          {format(day, 'EEE')}
                        </div>
                        <div className="text-sm font-display text-cast-iron mt-0.5">
                          {format(day, 'MMM d')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_SLOTS.map((slot) => (
                    <tr key={slot} className="border-b border-stone/5 last:border-0">
                      <td className="p-3 align-top">
                        <span className="text-xs font-body font-semibold text-sunday-brown">
                          {slot}
                        </span>
                      </td>
                      {planDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const key = `${dateStr}__${slot}`
                        const cellItems = itemsByDateSlot[key] || []

                        return (
                          <td
                            key={`${dateStr}-${slot}`}
                            className="p-0 align-top border-l border-stone/5 bg-cream/30"
                          >
                            <MealSlotCell
                              items={cellItems}
                              onAdd={() => handleAddRecipeClick(day, slot)}
                              onRemove={removeItem}
                              onUpdate={updateItem}
                              readonly={!isActive}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Generate Shopping List CTA */}
            {planItems.length > 0 && (
              <div className="text-center pb-4">
                <button
                  onClick={handleGenerateShoppingList}
                  disabled={generating}
                  className="bg-sienna text-flour rounded-xl px-8 py-4 font-body text-lg font-semibold hover:bg-sienna/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                >
                  {generating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  Generate Shopping List
                </button>
              </div>
            )}
          </>
        )}

        {/* Recipe Picker Overlay */}
        {showPicker && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-cast-iron/40"
              onClick={() => {
                setShowPicker(false)
                setPickerTarget(null)
              }}
            />
            <div className="relative ml-auto w-full max-w-sm h-full bg-flour shadow-2xl">
              {pickerTarget && (
                <div className="bg-linen px-4 py-3 border-b border-stone/10">
                  <p className="text-xs font-body text-stone">Adding to</p>
                  <p className="text-sm font-body font-semibold text-cast-iron">
                    {pickerTarget.slot} — {format(parseISO(pickerTarget.date), 'EEEE, MMM d')}
                  </p>
                </div>
              )}
              <RecipePicker
                recipes={recipes}
                onSelect={handleRecipeSelected}
                onClose={() => {
                  setShowPicker(false)
                  setPickerTarget(null)
                }}
              />
            </div>
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-cast-iron/40"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative bg-flour rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-display text-cast-iron mb-4">Create Meal Plan</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
                    Plan Title
                  </label>
                  <input
                    type="text"
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    placeholder="e.g., This Week's Meals"
                    className="w-full px-4 py-2 rounded-lg border border-stone/20 font-body text-sunday-brown focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newPlanStart}
                      onChange={handleStartDateChange}
                      className="w-full px-4 py-2 rounded-lg border border-stone/20 font-body text-sunday-brown focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newPlanEnd}
                      onChange={(e) => setNewPlanEnd(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-stone/20 font-body text-sunday-brown focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-stone/20 text-sunday-brown font-body font-semibold hover:bg-linen transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  disabled={!newPlanTitle.trim() || !newPlanStart || !newPlanEnd}
                  className="flex-1 px-4 py-2 rounded-lg bg-sienna text-flour font-body font-semibold hover:bg-sienna/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-cast-iron/40"
              onClick={() => setDeleteConfirm(false)}
            />
            <div className="relative bg-flour rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <Trash2 className="w-10 h-10 text-tomato mx-auto mb-3" />
              <h2 className="text-lg font-display text-cast-iron mb-2">Delete this plan?</h2>
              <p className="text-sm text-sunday-brown font-body mb-6">
                "{currentPlan?.title}" and all its meals will be removed. This can't be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-stone/20 text-sunday-brown font-body font-semibold hover:bg-linen transition-colors"
                >
                  Keep It
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-tomato text-flour font-body font-semibold hover:bg-tomato/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </PlanGate>
    </Layout>
  )
}
