import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import useCookbookBuilderStore from '../store/cookbookBuilderStore'
import Layout from '../components/layout/Layout'
import PlanGate from '../components/guards/PlanGate'
import ThemeCard from '../components/cookbooks/ThemeCard'
import RecipePageEditor from '../components/cookbooks/RecipePageEditor'
import SectionDividerEditor from '../components/cookbooks/SectionDividerEditor'
import StoryPageEditor from '../components/cookbooks/StoryPageEditor'
import DedicationEditor from '../components/cookbooks/DedicationEditor'
import FamilyHistoryEditor from '../components/cookbooks/FamilyHistoryEditor'
import CookbookPreview from '../components/cookbooks/CookbookPreview'
import OrderPrintModal from '../components/cookbooks/OrderPrintModal'
import CookbookPDFTemplate from '../components/pdf/CookbookPDFTemplate'
import { COOKBOOK_THEMES, getThemeFontUrl } from '../components/cookbooks/themes'
import {
  Loader2, ArrowLeft, ArrowRight, ChevronRight,
  BookOpen, Layers, FileText, Type, Heart, History,
  Plus, Trash2, GripVertical, Eye, Download, Printer,
  ChefHat, SeparatorHorizontal, BookText, FileQuestion,
} from 'lucide-react'

const PAGE_TYPE_ICONS = {
  recipe: ChefHat,
  section_divider: SeparatorHorizontal,
  story: BookText,
  dedication: Heart,
  family_history: History,
  blank: FileQuestion,
}

const PAGE_TYPE_LABELS = {
  recipe: 'Recipe',
  section_divider: 'Section',
  story: 'Story',
  dedication: 'Dedication',
  family_history: 'Family History',
  blank: 'Blank Page',
}

// ── Creation Wizard ──────────────────────────────────────────
function CreationWizard({ onComplete }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [themeId, setThemeId] = useState('farmhouse')
  const [dedication, setDedication] = useState('')
  const [familyHistory, setFamilyHistory] = useState('')
  const [saving, setSaving] = useState(false)
  const { currentFamily, currentMember } = useAuthStore()
  const { createCookbook, addPage } = useCookbookBuilderStore()

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0
    return true
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const cookbook = await createCookbook({
        family_id: currentFamily.id,
        created_by: currentMember.user_id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        theme: themeId,
        cover_image_url: null,
        status: 'draft',
        settings: {
          include_images: true,
          include_qr: false,
          include_audio_qr: false,
        },
      })

      // Add dedication page if provided
      if (dedication.trim()) {
        await addPage({
          cookbook_id: cookbook.id,
          page_type: 'dedication',
          title: 'Dedication',
          content: { text: dedication.trim() },
        })
      }

      // Add family history page if provided
      if (familyHistory.trim()) {
        await addPage({
          cookbook_id: cookbook.id,
          page_type: 'family_history',
          title: 'Our Family Story',
          content: { text: familyHistory.trim() },
        })
      }

      onComplete(cookbook.id)
    } catch (err) {
      console.error('Error creating cookbook:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-sienna' : 'bg-stone/20'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step 1: Title */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display text-cast-iron mb-2">Name Your Cookbook</h2>
            <p className="text-sunday-brown font-body text-sm">
              Give your printable cookbook a name and optional subtitle.
            </p>
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Johnson Family Cookbook"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 text-lg"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Recipes passed down through four generations"
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
              placeholder="A collection of our family's most treasured recipes..."
              rows={3}
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 2: Theme */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display text-cast-iron mb-2">Choose a Theme</h2>
            <p className="text-sunday-brown font-body text-sm">
              Select the visual style for your printed cookbook.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(COOKBOOK_THEMES).map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={themeId === theme.id}
                onSelect={setThemeId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Cover Image */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display text-cast-iron mb-2">Cover Image</h2>
            <p className="text-sunday-brown font-body text-sm">
              Upload a cover image or skip to use a text-only cover.
            </p>
          </div>
          <div className="border-2 border-dashed border-stone/30 rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-stone/30 mx-auto mb-4" />
            <p className="text-sunday-brown font-body mb-2">Cover image upload coming soon</p>
            <p className="text-sm text-stone font-body">
              AI cover generation will be available in a future update.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Dedication */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display text-cast-iron mb-2">Dedication</h2>
            <p className="text-sunday-brown font-body text-sm">
              Add a personal dedication to the opening of your cookbook. This is optional.
            </p>
          </div>
          <DedicationEditor text={dedication} onChange={({ text }) => setDedication(text)} />
        </div>
      )}

      {/* Step 5: Family History */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display text-cast-iron mb-2">Family History</h2>
            <p className="text-sunday-brown font-body text-sm">
              Share your family's cooking story. This page will appear before the recipes.
            </p>
          </div>
          <FamilyHistoryEditor
            text={familyHistory}
            photos={[]}
            onChange={({ text }) => setFamilyHistory(text)}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-stone/20">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-semibold
            text-sunday-brown border border-stone/30 hover:bg-linen disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-body font-semibold
              bg-sienna text-flour shadow-md hover:bg-sienna/90 disabled:opacity-50 transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-body font-semibold
              bg-sienna text-flour shadow-md hover:bg-sienna/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Cookbook
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Builder Interface ────────────────────────────────────────
function BuilderInterface({ cookbookId }) {
  const navigate = useNavigate()
  const { currentFamily, currentMember } = useAuthStore()
  const { recipes, fetchRecipes } = useRecipeStore()
  const {
    currentCookbook, pages, loading, saving,
    fetchCookbook, addPage, removePage, reorderPages, updateCookbook, updatePage,
  } = useCookbookBuilderStore()

  const [selectedPageId, setSelectedPageId] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showOrderPrint, setShowOrderPrint] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState(null)

  useEffect(() => {
    fetchCookbook(cookbookId)
  }, [cookbookId])

  useEffect(() => {
    if (currentFamily?.id && currentMember?.user_id) {
      fetchRecipes(currentFamily.id, currentMember.user_id)
    }
  }, [currentFamily?.id, currentMember?.user_id])

  const selectedPage = pages.find((p) => p.id === selectedPageId)

  const handleAddPage = async (pageType) => {
    setShowAddMenu(false)
    try {
      const defaults = {
        recipe: { title: 'New Recipe Page', content: {} },
        section_divider: { title: 'New Section', content: { title: 'New Section', description: '' } },
        story: { title: 'New Story', content: { title: 'New Story', content: '' } },
        dedication: { title: 'Dedication', content: { text: '' } },
        family_history: { title: 'Family History', content: { text: '' } },
        blank: { title: 'Blank Page', content: {} },
      }
      const def = defaults[pageType] || defaults.blank
      const newPage = await addPage({
        cookbook_id: cookbookId,
        page_type: pageType,
        title: def.title,
        content: def.content,
      })
      setSelectedPageId(newPage.id)
    } catch (err) {
      console.error('Error adding page:', err)
    }
  }

  const handleRemovePage = async (pageId) => {
    try {
      await removePage(pageId)
      if (selectedPageId === pageId) setSelectedPageId(null)
    } catch (err) {
      console.error('Error removing page:', err)
    }
  }

  const handlePageContentChange = async (updates) => {
    if (!selectedPage) return
    const newContent = { ...(selectedPage.content || {}), ...updates }
    try {
      await updatePage(selectedPage.id, { content: newContent })
    } catch (err) {
      console.error('Error updating page:', err)
    }
  }

  const handleRecipeSelect = async (recipeId) => {
    if (!selectedPage) return
    const recipe = recipes.find((r) => r.id === recipeId)
    try {
      await updatePage(selectedPage.id, {
        title: recipe?.title || 'Recipe',
        content: { ...selectedPage.content, recipe_id: recipeId },
      })
    } catch (err) {
      console.error('Error updating recipe page:', err)
    }
  }

  // Drag-and-drop reorder
  const handleDragStart = (idx) => setDraggedIdx(idx)
  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (targetIdx) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return
    const newOrder = [...pages]
    const [moved] = newOrder.splice(draggedIdx, 1)
    newOrder.splice(targetIdx, 0, moved)
    reorderPages(newOrder.map((p) => p.id))
    setDraggedIdx(null)
  }

  const handleExportPDF = async (format = 'standard') => {
    if (!currentCookbook) return
    setExporting(true)
    try {
      const doc = (
        <CookbookPDFTemplate
          cookbook={currentCookbook}
          pages={pages}
          recipes={recipes}
          themeId={currentCookbook.theme || 'farmhouse'}
          format={format}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentCookbook.title || 'cookbook'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting PDF:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleStatusChange = async (status) => {
    try {
      await updateCookbook(cookbookId, { status })
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-sienna animate-spin" />
      </div>
    )
  }

  if (!currentCookbook) {
    return (
      <div className="text-center py-24">
        <p className="text-stone font-body">Cookbook not found.</p>
      </div>
    )
  }

  const statusColors = {
    draft: 'bg-stone/20 text-stone',
    ready: 'bg-herb/20 text-herb',
    exported: 'bg-sienna/20 text-sienna',
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden -m-4 lg:-m-8">
      {/* Left Panel — Page List */}
      <div className="w-64 flex-shrink-0 bg-cast-iron flex flex-col">
        <div className="p-4 border-b border-flour/10">
          <button
            onClick={() => navigate('/cookbooks/printable')}
            className="flex items-center gap-2 text-sm text-flour/60 hover:text-flour font-body mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Cookbooks
          </button>
          <h2 className="font-display text-flour text-lg leading-tight truncate">
            {currentCookbook.title}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-body font-semibold ${statusColors[currentCookbook.status] || statusColors.draft}`}>
              {currentCookbook.status || 'draft'}
            </span>
            <span className="text-xs text-flour/40 font-body">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'}
            </span>
          </div>
        </div>

        {/* Page list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pages.map((page, idx) => {
            const Icon = PAGE_TYPE_ICONS[page.page_type] || FileText
            return (
              <div
                key={page.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                onClick={() => setSelectedPageId(page.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                  selectedPageId === page.id
                    ? 'bg-flour/15 text-flour'
                    : 'text-flour/60 hover:bg-flour/10 hover:text-flour/80'
                }`}
              >
                <GripVertical className="w-3 h-3 flex-shrink-0 opacity-40 cursor-grab" />
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-body truncate flex-1">{page.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePage(page.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-flour/40 hover:text-tomato transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )
          })}

          {pages.length === 0 && (
            <p className="text-xs text-flour/30 font-body text-center py-8 px-4">
              No pages yet. Add content using the buttons on the right.
            </p>
          )}
        </div>

        {/* Add page button */}
        <div className="p-3 border-t border-flour/10 relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm
              font-body font-semibold bg-sienna text-flour hover:bg-sienna/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Page
          </button>

          {showAddMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-flour rounded-lg shadow-xl border border-stone/20 overflow-hidden z-20">
              {[
                { type: 'recipe', icon: ChefHat, label: 'Recipe Page' },
                { type: 'section_divider', icon: SeparatorHorizontal, label: 'Section Divider' },
                { type: 'story', icon: BookText, label: 'Story Page' },
                { type: 'dedication', icon: Heart, label: 'Dedication' },
                { type: 'family_history', icon: History, label: 'Family History' },
                { type: 'blank', icon: FileQuestion, label: 'Blank Page' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => handleAddPage(type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-sunday-brown
                    hover:bg-linen transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-sienna" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center — Preview / Editor */}
      <div className="flex-1 bg-cream overflow-y-auto">
        {showPreview ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg text-cast-iron">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm font-body text-sienna hover:underline"
              >
                Back to Editor
              </button>
            </div>
            <CookbookPreview
              cookbook={currentCookbook}
              pages={pages}
              recipes={recipes}
              themeId={currentCookbook.theme || 'farmhouse'}
            />
          </div>
        ) : selectedPage ? (
          <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-stone font-body uppercase tracking-wider">
                {PAGE_TYPE_LABELS[selectedPage.page_type] || 'Page'}
              </span>
              {saving && <Loader2 className="w-3 h-3 text-stone animate-spin" />}
            </div>

            {selectedPage.page_type === 'recipe' && (
              <RecipePageEditor
                recipes={recipes}
                selectedRecipeId={selectedPage.content?.recipe_id}
                onSelect={handleRecipeSelect}
              />
            )}
            {selectedPage.page_type === 'section_divider' && (
              <SectionDividerEditor
                title={selectedPage.content?.title}
                description={selectedPage.content?.description}
                onChange={handlePageContentChange}
              />
            )}
            {selectedPage.page_type === 'story' && (
              <StoryPageEditor
                title={selectedPage.content?.title}
                content={selectedPage.content?.content}
                photos={selectedPage.content?.photos}
                onChange={handlePageContentChange}
              />
            )}
            {selectedPage.page_type === 'dedication' && (
              <DedicationEditor
                text={selectedPage.content?.text}
                onChange={handlePageContentChange}
              />
            )}
            {selectedPage.page_type === 'family_history' && (
              <FamilyHistoryEditor
                text={selectedPage.content?.text}
                photos={selectedPage.content?.photos}
                onChange={handlePageContentChange}
              />
            )}
            {selectedPage.page_type === 'blank' && (
              <div className="bg-linen rounded-lg p-8 text-center">
                <FileText className="w-8 h-8 text-stone/30 mx-auto mb-3" />
                <p className="text-sm text-stone font-body">
                  This is a blank page. It will appear as an empty page in the printed cookbook.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Layers className="w-12 h-12 text-stone/20 mx-auto mb-4" />
              <p className="text-sunday-brown font-body">
                Select a page from the sidebar or add a new one to start editing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel — Actions */}
      <div className="w-56 flex-shrink-0 bg-linen border-l border-stone/20 flex flex-col p-4 space-y-4 overflow-y-auto">
        {/* Preview */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body font-semibold
            bg-flour text-sunday-brown border border-stone/20 hover:bg-flour/80 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>

        {/* Export PDF */}
        <div className="space-y-2">
          <button
            onClick={() => handleExportPDF('standard')}
            disabled={exporting || pages.length === 0}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body font-semibold
              bg-sienna text-flour shadow-md hover:bg-sienna/90 disabled:opacity-50 transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export eBook PDF
          </button>
          <button
            onClick={() => handleExportPDF('print')}
            disabled={exporting || pages.length === 0}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body font-semibold
              bg-flour text-sunday-brown border border-stone/20 hover:bg-flour/80 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Print PDF
          </button>
        </div>

        {/* Order Print */}
        <button
          onClick={() => setShowOrderPrint(true)}
          disabled={pages.length === 0}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body font-semibold
            bg-flour text-sunday-brown border border-stone/20 hover:bg-flour/80 disabled:opacity-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Order Print
        </button>

        <hr className="border-stone/20" />

        {/* Status */}
        <div>
          <label className="block text-xs font-body font-semibold text-stone uppercase tracking-wider mb-2">
            Status
          </label>
          <select
            value={currentCookbook.status || 'draft'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-flour border border-stone/30 rounded-lg px-3 py-2 text-sm font-body
              text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="exported">Exported</option>
          </select>
        </div>

        {/* Settings */}
        <div>
          <label className="block text-xs font-body font-semibold text-stone uppercase tracking-wider mb-2">
            Options
          </label>
          <div className="space-y-2">
            {[
              { key: 'include_images', label: 'Include recipe images' },
              { key: 'include_qr', label: 'Include QR codes' },
              { key: 'include_audio_qr', label: 'Include audio QR codes' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentCookbook.settings?.[key] ?? false}
                  onChange={(e) => {
                    const settings = { ...(currentCookbook.settings || {}), [key]: e.target.checked }
                    updateCookbook(cookbookId, { settings })
                  }}
                  className="w-4 h-4 rounded border-stone/40 text-sienna focus:ring-sienna/50"
                />
                <span className="text-xs font-body text-sunday-brown">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Theme indicator */}
        <div>
          <label className="block text-xs font-body font-semibold text-stone uppercase tracking-wider mb-2">
            Theme
          </label>
          <div className="bg-flour rounded-lg p-3 border border-stone/20">
            <div className="text-sm font-body font-semibold text-cast-iron">
              {COOKBOOK_THEMES[currentCookbook.theme]?.name || 'Farmhouse'}
            </div>
            <div className="text-xs text-stone font-body">
              {COOKBOOK_THEMES[currentCookbook.theme]?.description || ''}
            </div>
          </div>
        </div>
      </div>

      {/* Order print modal */}
      {showOrderPrint && (
        <OrderPrintModal
          cookbook={currentCookbook}
          onClose={() => setShowOrderPrint(false)}
        />
      )}
    </div>
  )
}

// ── Main Page Component ──────────────────────────────────────
export default function CookbookBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [createdId, setCreatedId] = useState(null)

  // Load theme fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = getThemeFontUrl()
    document.head.appendChild(link)
    return () => document.head.removeChild(link)
  }, [])

  const cookbookId = id || createdId

  if (!cookbookId) {
    return (
      <Layout>
        <PlanGate feature="cookbookBuilder">
          <CreationWizard
            onComplete={(newId) => {
              setCreatedId(newId)
              navigate(`/cookbooks/printable/${newId}`, { replace: true })
            }}
          />
        </PlanGate>
      </Layout>
    )
  }

  return (
    <Layout>
      <PlanGate feature="cookbookBuilder">
        <BuilderInterface cookbookId={cookbookId} />
      </PlanGate>
    </Layout>
  )
}
