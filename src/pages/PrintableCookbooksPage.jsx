import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useCookbookBuilderStore from '../store/cookbookBuilderStore'
import Layout from '../components/layout/Layout'
import ActiveMemberGate from '../components/guards/ActiveMemberGate'
import { Plus, BookOpen, Loader2, Palette } from 'lucide-react'
import { COOKBOOK_THEMES } from '../components/cookbooks/themes'

export default function PrintableCookbooksPage() {
  const { currentFamily, currentMember } = useAuthStore()
  const { familyCookbooks, fetchFamilyCookbooks, loading, resetBuilder } = useCookbookBuilderStore()
  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  useEffect(() => {
    if (currentFamily?.id) {
      fetchFamilyCookbooks(currentFamily.id)
    }
    // Reset builder state when viewing list
    resetBuilder()
  }, [currentFamily?.id])

  const statusColors = {
    draft: 'bg-stone/20 text-stone',
    ready: 'bg-herb/20 text-herb',
    exported: 'bg-sienna/20 text-sienna',
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display text-cast-iron mb-1">Printable Cookbooks</h1>
            <p className="text-sunday-brown font-body text-sm">
              Design and print beautiful family cookbooks
            </p>
          </div>
          {isActive && (
            <Link
              to="/cookbooks/printable/new"
              className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-5 py-2.5
                font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Cookbook
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-sienna animate-spin" />
          </div>
        ) : familyCookbooks.length === 0 ? (
          <div className="bg-linen rounded-xl p-12 text-center shadow-sm border border-stone/20">
            <BookOpen className="w-16 h-16 text-stone/30 mx-auto mb-6" />
            <h2 className="text-2xl font-display text-cast-iron mb-3">
              No printable cookbooks yet
            </h2>
            <p className="text-sunday-brown font-body max-w-md mx-auto mb-6">
              Create a printable cookbook to compile your family recipes into a
              beautiful book you can export as PDF or order as a printed copy.
            </p>
            {isActive && (
              <Link
                to="/cookbooks/printable/new"
                className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-5 py-2.5
                  font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Cookbook
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyCookbooks.map((cb) => {
              const theme = COOKBOOK_THEMES[cb.theme] || COOKBOOK_THEMES.farmhouse
              return (
                <Link
                  key={cb.id}
                  to={`/cookbooks/printable/${cb.id}`}
                  className="bg-flour rounded-xl overflow-hidden border border-stone/20 shadow-sm
                    hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                >
                  {/* Cover preview */}
                  <div
                    className="h-40 flex items-center justify-center p-6"
                    style={{ backgroundColor: theme.bgColor }}
                  >
                    {cb.cover_image_url ? (
                      <img
                        src={cb.cover_image_url}
                        alt={cb.title}
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    ) : (
                      <div className="text-center">
                        <BookOpen
                          className="w-10 h-10 mx-auto mb-2"
                          style={{ color: theme.accentColor }}
                        />
                        <div
                          className="text-lg font-bold"
                          style={{
                            fontFamily: `'${theme.displayFont}', serif`,
                            color: theme.headingColor,
                          }}
                        >
                          {cb.title}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <h3 className="font-display text-lg text-cast-iron mb-1 truncate">{cb.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-stone font-body">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${statusColors[cb.status] || statusColors.draft}`}>
                        {cb.status || 'draft'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        {theme.name}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
