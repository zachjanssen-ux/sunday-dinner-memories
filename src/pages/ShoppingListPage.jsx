import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useShoppingListStore from '../store/shoppingListStore'
import Layout from '../components/layout/Layout'
import PrintView from '../components/shopping/PrintView'
import { formatQuantity } from '../lib/utils'
import {
  ShoppingCart,
  Check,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react'

const CATEGORY_LABELS = {
  produce: 'Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat & Seafood',
  bakery: 'Bakery',
  frozen: 'Frozen',
  canned: 'Canned Goods',
  dry_goods: 'Dry Goods & Pantry',
  spices: 'Spices & Seasonings',
  beverages: 'Beverages',
  other: 'Other',
}

const CATEGORY_ORDER = [
  'produce',
  'dairy',
  'meat',
  'bakery',
  'deli',
  'frozen',
  'canned',
  'dry_goods',
  'spices',
  'beverages',
  'other',
]

export default function ShoppingListPage() {
  const { id: listIdParam } = useParams()
  const { currentFamily, currentMember } = useAuthStore()
  const {
    lists,
    currentList,
    items,
    loading,
    fetchLists,
    fetchList,
    toggleChecked,
    addManualItem,
    removeItem,
    clearChecked,
    deleteList,
    clearCurrentList,
  } = useShoppingListStore()

  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  const [collapsed, setCollapsed] = useState({})
  const [showAddInput, setShowAddInput] = useState(null) // category key or 'global'
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('')
  const [showPrint, setShowPrint] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Load lists
  useEffect(() => {
    if (currentFamily?.id) {
      fetchLists(currentFamily.id)
    }
  }, [currentFamily?.id])

  // Auto-load from URL param or first list
  useEffect(() => {
    if (listIdParam) {
      fetchList(listIdParam)
    } else if (!currentList && lists.length > 0) {
      fetchList(lists[0].id)
    }
  }, [listIdParam, lists])

  // Cleanup realtime on unmount
  useEffect(() => {
    return () => clearCurrentList()
  }, [])

  // Group items by category
  const grouped = useMemo(() => {
    const groups = {}
    for (const item of items) {
      const cat = item.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }

    // Sort categories by defined order
    const sorted = {}
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) sorted[cat] = groups[cat]
    }
    // Add any categories not in the order list
    for (const [cat, catItems] of Object.entries(groups)) {
      if (!sorted[cat]) sorted[cat] = catItems
    }
    return sorted
  }, [items])

  const checkedCount = items.filter((i) => i.is_checked).length
  const totalCount = items.length

  const handleSelectList = (e) => {
    const listId = e.target.value
    if (listId) {
      fetchList(listId)
    } else {
      clearCurrentList()
    }
  }

  const handleAddItem = async (category) => {
    if (!newItemName.trim() || !currentList) return
    try {
      await addManualItem({
        shopping_list_id: currentList.id,
        item_name: newItemName.trim(),
        quantity: newItemQty ? parseFloat(newItemQty) : null,
        unit: newItemUnit || null,
        category: category || 'other',
        recipe_sources: [],
        is_checked: false,
      })
      setNewItemName('')
      setNewItemQty('')
      setNewItemUnit('')
      setShowAddInput(null)
    } catch (err) {
      console.error('Error adding item:', err)
    }
  }

  const handleDeleteList = async () => {
    if (!currentList) return
    try {
      await deleteList(currentList.id)
      setDeleteConfirm(false)
    } catch (err) {
      console.error('Error deleting list:', err)
    }
  }

  const toggleCollapse = (cat) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  if (showPrint && currentList) {
    return (
      <PrintView
        list={currentList}
        items={items}
        grouped={grouped}
        categoryLabels={CATEGORY_LABELS}
        onClose={() => setShowPrint(false)}
      />
    )
  }

  if (!currentFamily) {
    return (
      <Layout>
        <div className="text-center py-16">
          <ShoppingCart className="w-12 h-12 text-stone mx-auto mb-4" />
          <p className="text-sunday-brown font-body">Join a family to access shopping lists.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display text-cast-iron">Shopping List</h1>
            {currentList && (
              <p className="text-stone font-body text-sm mt-1">
                {checkedCount} of {totalCount} items checked
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* List selector */}
            <div className="relative">
              <select
                value={currentList?.id || ''}
                onChange={handleSelectList}
                className="appearance-none bg-flour border border-stone/20 rounded-lg px-4 py-2 pr-8 font-body text-sm text-sunday-brown focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50 cursor-pointer max-w-[200px]"
              >
                <option value="">Select a list...</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-sienna animate-spin mx-auto mb-4" />
            <p className="text-sunday-brown font-body">Loading shopping list...</p>
          </div>
        ) : !currentList ? (
          <div className="text-center py-16 bg-linen/50 rounded-2xl">
            <ShoppingCart className="w-16 h-16 text-stone/50 mx-auto mb-4" />
            <h2 className="text-xl font-display text-cast-iron mb-2">No shopping list yet</h2>
            <p className="text-sunday-brown font-body max-w-md mx-auto">
              Create a meal plan and generate a shopping list from it. All your ingredients will be
              combined, converted, and organized by aisle.
            </p>
          </div>
        ) : (
          <>
            {/* Actions Bar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setShowPrint(true)}
                className="text-sm text-stone hover:text-sunday-brown flex items-center gap-1 font-body transition-colors px-3 py-1.5 rounded-lg hover:bg-linen border border-stone/15"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              {checkedCount > 0 && (
                <button
                  onClick={() => clearChecked(currentList.id)}
                  className="text-sm text-stone hover:text-sunday-brown flex items-center gap-1 font-body transition-colors px-3 py-1.5 rounded-lg hover:bg-linen border border-stone/15"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Clear Checked ({checkedCount})
                </button>
              )}
              <div className="flex-1" />
              {isActive && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-sm text-stone hover:text-tomato flex items-center gap-1 font-body transition-colors px-3 py-1.5 rounded-lg hover:bg-tomato/5 border border-stone/15"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete List
                </button>
              )}
            </div>

            {/* All done state */}
            {totalCount > 0 && checkedCount === totalCount && (
              <div className="bg-herb/10 rounded-xl p-6 text-center mb-6 border border-herb/20">
                <CheckCircle2 className="w-10 h-10 text-herb mx-auto mb-2" />
                <p className="font-display text-lg text-cast-iron">All items checked off!</p>
                <p className="text-sm text-sunday-brown font-body mt-1">
                  Time to cook something delicious.
                </p>
              </div>
            )}

            {/* Grouped Items */}
            <div className="space-y-3">
              {Object.entries(grouped).map(([category, catItems]) => {
                const catChecked = catItems.filter((i) => i.is_checked).length
                const isCollapsed = collapsed[category]

                return (
                  <div
                    key={category}
                    className="bg-flour rounded-xl border border-stone/10 overflow-hidden shadow-sm"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCollapse(category)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-linen/50 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-herb" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-herb" />
                      )}
                      <span className="font-body font-semibold text-sm text-herb flex-1 text-left">
                        {CATEGORY_LABELS[category] || category}
                      </span>
                      <span className="text-xs font-body text-stone">
                        {catChecked}/{catItems.length}
                      </span>
                    </button>

                    {/* Items */}
                    {!isCollapsed && (
                      <div className="border-t border-stone/5">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-4 py-2.5 border-b border-stone/5 last:border-0 transition-colors ${
                              item.is_checked ? 'bg-linen/30' : ''
                            }`}
                          >
                            {/* Checkbox — viewers CAN check items */}
                            <button
                              onClick={() => toggleChecked(item.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                item.is_checked
                                  ? 'bg-herb border-herb'
                                  : 'border-stone/30 hover:border-herb/50'
                              }`}
                            >
                              {item.is_checked && <Check className="w-3 h-3 text-flour" />}
                            </button>

                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-body text-sm ${
                                  item.is_checked
                                    ? 'line-through text-stone/50'
                                    : 'text-cast-iron'
                                }`}
                              >
                                {item.item_name}
                              </p>
                              {item.recipe_sources && item.recipe_sources.length > 0 && (
                                <p className="text-xs text-stone font-body truncate">
                                  {item.recipe_sources.join(', ')}
                                </p>
                              )}
                            </div>

                            {/* Quantity */}
                            <span
                              className={`text-sm font-body whitespace-nowrap ${
                                item.is_checked ? 'text-stone/40' : 'text-sunday-brown'
                              }`}
                            >
                              {item.quantity != null
                                ? `${formatQuantity(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`
                                : ''}
                            </span>

                            {/* Remove (active members only) */}
                            {isActive && (
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-stone/30 hover:text-tomato transition-colors flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Add manual item inline */}
                        {showAddInput === category ? (
                          <div className="px-4 py-2 flex items-center gap-2 bg-linen/30">
                            <input
                              type="text"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              placeholder="Item name"
                              className="flex-1 px-2 py-1 rounded border border-stone/20 font-body text-sm focus:outline-none focus:ring-1 focus:ring-sienna/30"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddItem(category)
                                if (e.key === 'Escape') setShowAddInput(null)
                              }}
                            />
                            <input
                              type="text"
                              value={newItemQty}
                              onChange={(e) => setNewItemQty(e.target.value)}
                              placeholder="Qty"
                              className="w-14 px-2 py-1 rounded border border-stone/20 font-body text-sm focus:outline-none focus:ring-1 focus:ring-sienna/30"
                            />
                            <input
                              type="text"
                              value={newItemUnit}
                              onChange={(e) => setNewItemUnit(e.target.value)}
                              placeholder="Unit"
                              className="w-16 px-2 py-1 rounded border border-stone/20 font-body text-sm focus:outline-none focus:ring-1 focus:ring-sienna/30"
                            />
                            <button
                              onClick={() => handleAddItem(category)}
                              className="text-herb hover:text-herb/80 transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setShowAddInput(null)}
                              className="text-stone hover:text-sunday-brown transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setShowAddInput(category)
                              setNewItemName('')
                              setNewItemQty('')
                              setNewItemUnit('')
                            }}
                            className="w-full px-4 py-2 text-xs text-stone hover:text-herb font-body text-left hover:bg-herb/5 transition-colors"
                          >
                            + Add item
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Global add item (when list has no items or as fallback) */}
            {totalCount === 0 && (
              <div className="text-center py-8">
                <p className="text-stone font-body mb-4">This list is empty.</p>
                <button
                  onClick={() => {
                    setShowAddInput('other')
                    setNewItemName('')
                    setNewItemQty('')
                    setNewItemUnit('')
                  }}
                  className="text-sienna hover:text-sienna/80 font-body font-semibold flex items-center gap-1 mx-auto transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add an item manually
                </button>
              </div>
            )}
          </>
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
              <h2 className="text-lg font-display text-cast-iron mb-2">Delete this list?</h2>
              <p className="text-sm text-sunday-brown font-body mb-6">
                This shopping list will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-stone/20 text-sunday-brown font-body font-semibold hover:bg-linen transition-colors"
                >
                  Keep It
                </button>
                <button
                  onClick={handleDeleteList}
                  className="flex-1 px-4 py-2 rounded-lg bg-tomato text-flour font-body font-semibold hover:bg-tomato/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
