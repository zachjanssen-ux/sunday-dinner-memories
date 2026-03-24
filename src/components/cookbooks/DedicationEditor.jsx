export default function DedicationEditor({ text, onChange }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-cast-iron">Dedication Page</h3>
      <p className="text-sm text-stone font-body">
        A heartfelt dedication to open your cookbook. Rendered in handwriting style.
      </p>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Dedication Text
        </label>
        <textarea
          value={text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="For Grandma, who taught us that love is the secret ingredient..."
          rows={6}
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 text-sunday-brown
            focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-y"
          style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem' }}
        />
      </div>

      {/* Preview */}
      {text && (
        <div className="bg-cream rounded-lg p-8 border border-stone/20 text-center">
          <p
            className="text-sunday-brown leading-relaxed"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '1.5rem' }}
          >
            {text}
          </p>
        </div>
      )}
    </div>
  )
}
