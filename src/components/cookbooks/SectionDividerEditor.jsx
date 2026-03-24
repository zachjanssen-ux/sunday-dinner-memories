export default function SectionDividerEditor({ title, description, onChange }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-cast-iron">Section Divider</h3>
      <p className="text-sm text-stone font-body">
        Add a section break to organize your cookbook into chapters.
      </p>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Section Title *
        </label>
        <input
          type="text"
          value={title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Main Courses"
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
            focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
        />
      </div>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Description (optional)
        </label>
        <textarea
          value={description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="The heart of every Sunday dinner..."
          rows={3}
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
            focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
        />
      </div>
    </div>
  )
}
