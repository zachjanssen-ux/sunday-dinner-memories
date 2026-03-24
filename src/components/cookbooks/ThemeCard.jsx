import { Check } from 'lucide-react'

export default function ThemeCard({ theme, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(theme.id)}
      className={`relative text-left rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
        selected
          ? 'border-sienna ring-2 ring-sienna/30 scale-[1.02]'
          : 'border-stone/20 hover:border-stone/40'
      }`}
    >
      {/* Selected check */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-sienna flex items-center justify-center z-10">
          <Check className="w-4 h-4 text-flour" />
        </div>
      )}

      {/* Mini preview */}
      <div
        className="p-5 min-h-[160px]"
        style={{ backgroundColor: theme.bgColor }}
      >
        <div
          className="text-lg font-bold mb-1 leading-tight"
          style={{
            fontFamily: `'${theme.displayFont}', serif`,
            color: theme.headingColor,
          }}
        >
          {theme.sampleTitle}
        </div>
        <div
          className="text-xs mb-3 italic"
          style={{
            fontFamily: `'${theme.bodyFont}', serif`,
            color: theme.accentColor,
          }}
        >
          {theme.sampleSubtitle}
        </div>
        <div
          className="h-0.5 w-12 mb-3 rounded"
          style={{ backgroundColor: theme.dividerColor }}
        />
        <div
          className="text-[10px] leading-relaxed"
          style={{
            fontFamily: `'${theme.bodyFont}', serif`,
            color: theme.textColor,
          }}
        >
          Preheat oven to 375. Peel and slice apples into thin wedges...
        </div>
      </div>

      {/* Theme name + description */}
      <div className="bg-linen px-4 py-3 border-t border-stone/10">
        <div className="font-display text-sm text-cast-iron">{theme.name}</div>
        <div className="text-[11px] text-stone font-body leading-snug mt-0.5">
          {theme.description}
        </div>
      </div>
    </button>
  )
}
