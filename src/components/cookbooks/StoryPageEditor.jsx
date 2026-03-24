export default function StoryPageEditor({ title, content, photos, onChange }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-cast-iron">Story Page</h3>
      <p className="text-sm text-stone font-body">
        Share a family story, memory, or tradition alongside your recipes.
      </p>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="The Year Grandma Burned the Turkey"
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
            focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
        />
      </div>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Story Content *
        </label>
        <textarea
          value={content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Write your story here. Markdown formatting is supported..."
          rows={10}
          className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
            focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-y"
        />
        <p className="text-xs text-stone font-body mt-1">
          Supports markdown: **bold**, *italic*, ## headings
        </p>
      </div>

      <div>
        <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
          Photos (optional)
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
                alt={`Story photo ${i + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
