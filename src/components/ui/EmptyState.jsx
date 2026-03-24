import { Link } from 'react-router-dom'
import {
  Utensils,
  Mic,
  BookOpen,
  CalendarDays,
  Search,
  Users,
} from 'lucide-react'

const variants = {
  noRecipes: {
    icon: Utensils,
    headline: 'Your kitchen is quiet',
    description: "Let's fill it with family favorites.",
    cta: { label: 'Add Recipe', to: '/recipes/new' },
  },
  noAudioMemories: {
    icon: Mic,
    headline: 'No stories yet',
    description: 'The best recipes come with stories. Record one.',
    cta: null,
  },
  noCookbooks: {
    icon: BookOpen,
    headline: 'No cookbooks yet',
    description: 'Every family deserves a cookbook. Start yours.',
    cta: { label: 'Create Cookbook', to: '/cookbooks' },
  },
  noMealPlan: {
    icon: CalendarDays,
    headline: "What's for dinner?",
    description: "What's for dinner this week? Let's plan it together.",
    cta: null,
  },
  noResults: {
    icon: Search,
    headline: 'No matches',
    description: "Hmm, nothing in the recipe box matched that.",
    cta: null,
  },
  noFamily: {
    icon: Users,
    headline: 'No family yet',
    description: "You haven't joined a family yet. Create one or join with a code.",
    cta: { label: 'Create a Family', to: '/create-family' },
  },
}

export default function EmptyState({
  variant,
  icon: IconOverride,
  headline: headlineOverride,
  description: descOverride,
  cta: ctaOverride,
  children,
}) {
  const preset = variant ? variants[variant] : {}
  const Icon = IconOverride || preset.icon || Utensils
  const headline = headlineOverride || preset.headline || 'Nothing here yet'
  const description = descOverride || preset.description || ''
  const cta = ctaOverride !== undefined ? ctaOverride : preset.cta

  return (
    <div className="bg-linen rounded-xl p-12 text-center shadow-sm border border-stone/20">
      <div className="max-w-sm mx-auto">
        <Icon className="w-16 h-16 text-stone/30 mx-auto mb-6" />
        <h2 className="text-2xl font-display text-cast-iron mb-3">
          {headline}
        </h2>
        <p className="text-sunday-brown font-body mb-6">{description}</p>
        {cta && (
          <Link
            to={cta.to}
            className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3
              font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
          >
            {cta.label}
          </Link>
        )}
        {children}
      </div>
    </div>
  )
}
