import ReactMarkdown from 'react-markdown'

export default function StoryDisplay({ blogContent }) {
  if (!blogContent?.body) return null

  const { body, photos } = blogContent

  return (
    <div className="mb-10">
      {/* Story text */}
      <div className="font-body text-sunday-brown text-lg leading-relaxed">
        <ReactMarkdown
          components={{
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-sienna/40 pl-4 my-6 font-handwritten text-2xl text-sunday-brown/80 italic">
                {children}
              </blockquote>
            ),
            p: ({ children }) => <p className="mb-4">{children}</p>,
            h2: ({ children }) => (
              <h2 className="text-2xl font-display text-cast-iron mt-8 mb-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-display text-cast-iron mt-6 mb-2">{children}</h3>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-cast-iron">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-sunday-brown/80">{children}</em>
            ),
          }}
        >
          {body}
        </ReactMarkdown>
      </div>

      {/* Photo gallery */}
      {photos?.length > 0 && (
        <div className={`mt-6 gap-3 ${
          photos.length === 1
            ? 'grid grid-cols-1'
            : photos.length === 2
              ? 'grid grid-cols-2'
              : 'grid grid-cols-2 md:grid-cols-3'
        }`}>
          {photos.map((url, idx) => (
            <div
              key={idx}
              className={`rounded-xl overflow-hidden border border-stone/10 shadow-sm ${
                photos.length === 1 ? 'max-h-96' : 'aspect-square'
              }`}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="mt-8 mb-2 flex items-center gap-4">
        <div className="flex-1 h-px bg-stone/20" />
        <span className="text-stone text-sm font-handwritten text-lg">The Recipe</span>
        <div className="flex-1 h-px bg-stone/20" />
      </div>
    </div>
  )
}
