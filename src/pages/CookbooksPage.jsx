import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import Layout from '../components/layout/Layout'
import { Plus, BookOpen, Loader2, X } from 'lucide-react'

function CreateCookbookModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const { addCookbook } = useRecipeStore()
  const { currentFamily, currentMember } = useAuthStore()

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await addCookbook({
        title: title.trim(),
        description: description.trim(),
        family_id: currentFamily.id,
        created_by: currentMember.id,
      })
      onClose()
    } catch (err) {
      console.error('Error creating cookbook:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-cast-iron/50 flex items-center justify-center z-50 p-4">
      <div className="bg-flour rounded-xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-cast-iron">New Cookbook</h3>
          <button onClick={onClose} className="text-stone hover:text-sunday-brown">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Holiday Favorites"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of our best holiday recipes..."
              rows={3}
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-body font-semibold text-sunday-brown border border-stone/30 hover:bg-linen"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="px-4 py-2 rounded-lg text-sm font-body font-semibold bg-sienna text-flour shadow-md
                hover:bg-sienna/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CookbooksPage() {
  const { currentFamily, currentMember } = useAuthStore()
  const { cookbooks, fetchCookbooks, loading } = useRecipeStore()
  const [showCreate, setShowCreate] = useState(false)
  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  useEffect(() => {
    if (currentFamily?.id) {
      fetchCookbooks(currentFamily.id)
    }
  }, [currentFamily?.id])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display text-cast-iron mb-1">Cookbooks</h1>
            <p className="text-sunday-brown font-body text-sm">
              Curated collections of family recipes
            </p>
          </div>
          {isActive && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-5 py-2.5
                font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Cookbook
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-sienna animate-spin" />
          </div>
        ) : cookbooks.length === 0 ? (
          <div className="bg-linen rounded-xl p-12 text-center shadow-sm border border-stone/20">
            <BookOpen className="w-16 h-16 text-stone/30 mx-auto mb-6" />
            <h2 className="text-2xl font-display text-cast-iron mb-3">
              No cookbooks yet
            </h2>
            <p className="text-sunday-brown font-body max-w-md mx-auto">
              Create a cookbook to organize your family recipes into themed collections.
              Think "Holiday Dinners", "Weeknight Meals", or "Grandma's Best".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cookbooks.map((cb) => (
              <Link
                key={cb.id}
                to={`/cookbooks/${cb.id}`}
                className="bg-linen rounded-xl p-6 border border-stone/20 shadow-sm
                  hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <BookOpen className="w-8 h-8 text-sienna mb-3" />
                <h3 className="font-display text-lg text-cast-iron mb-1">{cb.title}</h3>
                {cb.description && (
                  <p className="text-sm text-sunday-brown font-body mb-3 line-clamp-2">
                    {cb.description}
                  </p>
                )}
                <p className="text-xs text-stone font-body">
                  {(cb.cookbook_recipes || []).length} recipes
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateCookbookModal onClose={() => setShowCreate(false)} />}
    </Layout>
  )
}
