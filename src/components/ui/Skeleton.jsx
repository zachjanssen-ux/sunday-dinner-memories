/**
 * Skeleton loading components styled with brand warm tones.
 * Base: linen (#F5EDDF), shine: stone (#9B8E82)
 */

function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{
        background: 'linear-gradient(90deg, #F5EDDF 25%, #9B8E82 50%, #F5EDDF 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function RecipeCardSkeleton() {
  return (
    <div className="bg-linen rounded-xl shadow-sm border border-stone/20 overflow-hidden">
      {/* Photo placeholder */}
      <SkeletonBlock className="h-48 rounded-none" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-6 w-16 rounded-full" />
          <SkeletonBlock className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-4">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

export function RecipeDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="h-64 rounded-xl" />
      <SkeletonBlock className="h-10 w-2/3" />
      <SkeletonBlock className="h-5 w-1/3" />
      <div className="flex gap-2">
        <SkeletonBlock className="h-8 w-20 rounded-full" />
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex gap-4">
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-5 w-24" />
      </div>
      <SkeletonBlock className="h-px w-full" />
      <SkeletonBlock className="h-8 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-5 w-full" />
        ))}
      </div>
      <SkeletonBlock className="h-8 w-32" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
            <SkeletonBlock className="h-5 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default SkeletonBlock
