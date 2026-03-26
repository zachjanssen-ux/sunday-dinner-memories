import { useEffect } from 'react'
import { formatQuantity } from '../../lib/utils'
import { ArrowLeft } from 'lucide-react'

export default function PrintView({ list, items, grouped, categoryLabels, onClose }) {
  useEffect(() => {
    // Auto-trigger print dialog after render
    const timeout = setTimeout(() => {
      window.print()
    }, 300)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Screen-only back button */}
      <div className="print:hidden p-4 bg-cream border-b border-stone/10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sunday-brown font-body text-sm hover:text-sienna transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shopping List
        </button>
      </div>

      {/* Printable content */}
      <div className="max-w-2xl mx-auto p-8 print:p-4 print:max-w-none">
        {/* Header */}
        <div className="mb-6 print:mb-4 border-b-2 border-gray-200 pb-4 print:pb-2">
          <h1 className="text-2xl print:text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            {list.title || 'Shopping List'}
          </h1>
          {list.created_at && (
            <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
              Created {new Date(list.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Grouped items */}
        <div className="space-y-4 print:space-y-3">
          {Object.entries(grouped).map(([category, catItems]) => {
            const unchecked = catItems.filter((i) => !i.is_checked)
            if (unchecked.length === 0) return null

            return (
              <div key={category} className="break-inside-avoid">
                <h2
                  className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-2 print:mb-1 border-b border-gray-100 pb-1"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {categoryLabels[category] || category}
                </h2>
                <div className="space-y-1">
                  {unchecked.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 py-0.5">
                      {/* Empty checkbox for printing */}
                      <span className="inline-block w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                          {item.name}
                          {item.quantity != null && (
                            <span className="text-gray-500 ml-1">
                              — {formatQuantity(item.quantity)}
                              {item.unit ? ` ${item.unit}` : ''}
                            </span>
                          )}
                        </span>
                        {item.recipe_sources && item.recipe_sources.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({item.recipe_sources.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 print:mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400" style={{ fontFamily: 'Georgia, serif' }}>
            Sunday Dinner Memories
          </p>
        </div>
      </div>
    </div>
  )
}
