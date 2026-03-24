import { useState } from 'react'
import useRecipeStore from '../../store/recipeStore'
import useAuthStore from '../../store/authStore'
import { X, Plus, Loader2, BookOpen, Check } from 'lucide-react'

export function AddToCookbookModal({ recipeId, onClose }) {
  const { cookbooks, addRecipeToCookbook } = useRecipeStore()
  const [adding, setAdding] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const handleAdd = async (cookbookId) => {
    setAdding(cookbookId)
    try {
      await addRecipeToCookbook(cookbookId, recipeId)
    } catch (err) {
      console.error('Error adding to cookbook:', err)
    } finally {
      setAdding(null)
    }
  }

  const isInCookbook = (cookbook) =>
    (cookbook.cookbook_recipes || []).some((cr) => cr.recipe_id === recipeId)

  return (
    <div className="fixed inset-0 bg-cast-iron/50 flex items-center justify-center z-50 p-4">
      <div className="bg-flour rounded-xl p-6 max-w-md w-full shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-cast-iron">Add to Cookbook</h3>
          <button onClick={onClose} className="text-stone hover:text-sunday-brown">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showCreate ? (
          <CreateCookbookForm
            onDone={() => setShowCreate(false)}
            onClose={() => setShowCreate(false)}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {cookbooks.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 text-stone/30 mx-auto mb-3" />
                  <p className="text-sm font-body text-stone">
                    No cookbooks yet. Create one to get started.
                  </p>
                </div>
              ) : (
                cookbooks.map((cb) => {
                  const alreadyIn = isInCookbook(cb)
                  return (
                    <button
                      key={cb.id}
                      onClick={() => !alreadyIn && handleAdd(cb.id)}
                      disabled={alreadyIn || adding === cb.id}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                        alreadyIn
                          ? 'bg-herb/10 border-herb/20 cursor-default'
                          : 'bg-flour border-stone/20 hover:bg-linen cursor-pointer'
                      }`}
                    >
                      <div>
                        <p className="font-body font-semibold text-sm text-cast-iron">
                          {cb.title}
                        </p>
                        {cb.description && (
                          <p className="text-xs text-stone font-body mt-0.5">
                            {cb.description}
                          </p>
                        )}
                        <p className="text-xs text-stone/60 font-body mt-0.5">
                          {(cb.cookbook_recipes || []).length} recipes
                        </p>
                      </div>
                      {alreadyIn ? (
                        <Check className="w-5 h-5 text-herb shrink-0" />
                      ) : adding === cb.id ? (
                        <Loader2 className="w-5 h-5 text-sienna animate-spin shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-stone shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-stone/40
                text-sm font-body font-semibold text-sienna hover:bg-linen transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Cookbook
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function CreateCookbookForm({ onDone, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const { addCookbook } = useRecipeStore()
  const { currentFamily, currentMember } = useAuthStore()

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await addCookbook({
        title: title.trim(),
        description: description.trim(),
        family_id: currentFamily.id,
        created_by: currentMember.id,
      })
      onDone()
    } catch (err) {
      console.error('Error creating cookbook:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Cookbook Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Holiday Favorites"
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
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
          placeholder="A collection of our best holiday recipes..."
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
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="px-4 py-2 rounded-lg text-sm font-body font-semibold bg-sienna text-flour shadow-md
            hover:bg-sienna/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Cookbook
        </button>
      </div>
    </div>
  )
}
