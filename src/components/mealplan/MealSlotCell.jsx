import { useState } from 'react'
import { X, ChevronDown, MessageSquare } from 'lucide-react'

const SERVINGS_OPTIONS = [0.5, 1, 1.5, 2, 3, 4]

export default function MealSlotCell({ items, onAdd, onRemove, onUpdate, readonly }) {
  const [editingItem, setEditingItem] = useState(null)
  const [customServings, setCustomServings] = useState('')
  const [notes, setNotes] = useState('')

  const startEdit = (item) => {
    setEditingItem(item.id)
    setCustomServings(item.servings_multiplier || 1)
    setNotes(item.notes || '')
  }

  const saveEdit = (itemId) => {
    onUpdate(itemId, {
      servings_multiplier: parseFloat(customServings) || 1,
      notes,
    })
    setEditingItem(null)
  }

  return (
    <div className="min-h-[60px] p-1.5 space-y-1.5">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-flour rounded-md border border-stone/15 p-2 group relative"
        >
          {editingItem === item.id ? (
            <div className="space-y-2">
              <p className="text-xs font-body font-semibold text-cast-iron truncate">
                {item.recipes?.title || 'Recipe'}
              </p>
              <div>
                <label className="text-xs text-stone font-body">Servings</label>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {SERVINGS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setCustomServings(s)}
                      className={`text-xs px-2 py-0.5 rounded-full font-body transition-colors ${
                        parseFloat(customServings) === s
                          ? 'bg-sienna text-flour'
                          : 'bg-linen text-sunday-brown hover:bg-stone/20'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                  <input
                    type="number"
                    value={customServings}
                    onChange={(e) => setCustomServings(e.target.value)}
                    className="w-12 text-xs px-1.5 py-0.5 rounded border border-stone/20 text-center font-body focus:outline-none focus:ring-1 focus:ring-sienna/30"
                    min="0.25"
                    step="0.25"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone font-body">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., double the garlic"
                  className="w-full text-xs px-2 py-1 rounded border border-stone/20 font-body focus:outline-none focus:ring-1 focus:ring-sienna/30 mt-0.5"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => saveEdit(item.id)}
                  className="text-xs bg-herb text-flour px-2 py-0.5 rounded font-body hover:bg-herb/80 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-xs text-stone hover:text-sunday-brown px-2 py-0.5 font-body transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`flex items-start gap-1.5 ${!readonly ? 'cursor-pointer' : ''}`}
                onClick={() => !readonly && startEdit(item)}
              >
                {item.recipes?.original_image_url ? (
                  <img
                    src={item.recipes.original_image_url}
                    alt=""
                    className="w-6 h-6 rounded object-cover flex-shrink-0 mt-0.5"
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body font-semibold text-cast-iron truncate leading-tight">
                    {item.recipes?.title || 'Recipe'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {item.servings_multiplier && item.servings_multiplier !== 1 && (
                      <span className="text-[10px] bg-sienna/15 text-sienna px-1 py-0 rounded-full font-body font-semibold">
                        {item.servings_multiplier}x
                      </span>
                    )}
                    {item.notes && (
                      <MessageSquare className="w-2.5 h-2.5 text-stone" />
                    )}
                  </div>
                </div>
              </div>
              {!readonly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(item.id)
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-stone hover:text-tomato transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      ))}

      {!readonly && (
        <button
          onClick={onAdd}
          className="w-full text-xs text-stone hover:text-sienna hover:bg-sienna/5 rounded-md py-1.5 font-body transition-colors border border-dashed border-stone/20 hover:border-sienna/30"
        >
          + Add
        </button>
      )}
    </div>
  )
}
