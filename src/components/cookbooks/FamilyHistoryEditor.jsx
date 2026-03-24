export default function FamilyHistoryEditor({ text, photos, onChange }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-cast-iron">Family History</h3>
      <p className="text-sm text-stone font-body">
        Tell the story of your family's cooking traditions and heritage.
      </p>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Family Story *
        </label>
        <textarea
          value={text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Our family has been cooking together for four generations. It all started when..."
          rows={10}
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
            focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Family Photos (optional)
        </label>
        <div className="border-2 border-dashed border-stone/30 rounded-lg p-6 text-center hover:border-stone/50 transition-colors">
          <p className="text-sm text-stone font-body">
            Photo uploads coming soon
          </p>
        </div>
        {photos && photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Family photo ${i + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
