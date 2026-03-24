import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { COOKBOOK_THEMES } from './themes'

function CoverPage({ cookbook, theme }) {
  return (
    <div
      className="w-full aspect-[8.5/11] flex flex-col items-center justify-center p-12 text-center"
      style={{ backgroundColor: theme.bgColor }}
    >
      {cookbook.cover_image_url && (
        <img
          src={cookbook.cover_image_url}
          alt="Cover"
          className="w-48 h-48 object-cover rounded-lg mb-8 shadow-md"
        />
      )}
      <h1
        className="text-3xl mb-3 leading-tight"
        style={{
          fontFamily: `'${theme.displayFont}', serif`,
          color: theme.headingColor,
          fontWeight: 700,
        }}
      >
        {cookbook.title || 'Untitled Cookbook'}
      </h1>
      {cookbook.subtitle && (
        <p
          className="text-lg mb-4"
          style={{
            fontFamily: `'${theme.bodyFont}', serif`,
            color: theme.textColor,
          }}
        >
          {cookbook.subtitle}
        </p>
      )}
      <div
        className="h-0.5 w-16 rounded mt-2"
        style={{ backgroundColor: theme.dividerColor }}
      />
    </div>
  )
}

function DedicationPage({ page, theme }) {
  const content = page.content || {}
  return (
    <div
      className="w-full aspect-[8.5/11] flex items-center justify-center p-16"
      style={{ backgroundColor: theme.bgColor }}
    >
      <p
        className="text-center leading-relaxed"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.5rem',
          color: theme.textColor,
        }}
      >
        {content.text || 'No dedication text yet.'}
      </p>
    </div>
  )
}

function FamilyHistoryPage({ page, theme }) {
  const content = page.content || {}
  return (
    <div
      className="w-full aspect-[8.5/11] p-10 overflow-hidden"
      style={{ backgroundColor: theme.bgColor }}
    >
      <h2
        className="text-2xl mb-6"
        style={{
          fontFamily: `'${theme.displayFont}', serif`,
          color: theme.headingColor,
          fontWeight: 700,
        }}
      >
        Our Family Story
      </h2>
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          fontFamily: `'${theme.bodyFont}', serif`,
          color: theme.textColor,
        }}
      >
        {content.text || 'No family history written yet.'}
      </p>
    </div>
  )
}

function SectionDividerPage({ page, theme }) {
  const content = page.content || {}
  return (
    <div
      className="w-full aspect-[8.5/11] flex flex-col items-center justify-center p-16 text-center"
      style={{ backgroundColor: theme.bgColor }}
    >
      <div
        className="h-0.5 w-16 rounded mb-8"
        style={{ backgroundColor: theme.dividerColor }}
      />
      <h2
        className="text-3xl mb-4"
        style={{
          fontFamily: `'${theme.displayFont}', serif`,
          color: theme.headingColor,
          fontWeight: 700,
        }}
      >
        {content.title || page.title || 'Section'}
      </h2>
      {content.description && (
        <p
          className="text-base max-w-sm"
          style={{
            fontFamily: `'${theme.bodyFont}', serif`,
            color: theme.textColor,
          }}
        >
          {content.description}
        </p>
      )}
      <div
        className="h-0.5 w-16 rounded mt-8"
        style={{ backgroundColor: theme.dividerColor }}
      />
    </div>
  )
}

function RecipePage({ page, recipes, theme }) {
  const content = page.content || {}
  const recipe = recipes.find((r) => r.id === content.recipe_id)

  if (!recipe) {
    return (
      <div
        className="w-full aspect-[8.5/11] flex items-center justify-center p-10"
        style={{ backgroundColor: theme.bgColor }}
      >
        <p className="text-stone font-body">Recipe not found or not selected.</p>
      </div>
    )
  }

  const ingredients = (recipe.recipe_ingredients || []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const instructions = (recipe.recipe_instructions || []).sort(
    (a, b) => (a.sort_order ?? a.step_number ?? 0) - (b.sort_order ?? b.step_number ?? 0)
  )

  return (
    <div
      className="w-full aspect-[8.5/11] p-10 overflow-hidden"
      style={{ backgroundColor: theme.bgColor }}
    >
      <h2
        className="text-2xl mb-1"
        style={{
          fontFamily: `'${theme.displayFont}', serif`,
          color: theme.headingColor,
          fontWeight: 700,
        }}
      >
        {recipe.title}
      </h2>
      {recipe.cook_name && recipe.cook_name !== 'Unknown' && (
        <p
          className="text-sm mb-3 italic"
          style={{
            fontFamily: "'Caveat', cursive",
            color: theme.accentColor,
            fontSize: '1rem',
          }}
        >
          A recipe by {recipe.cook_name}
        </p>
      )}
      {recipe.description && (
        <p
          className="text-xs mb-3 leading-relaxed"
          style={{
            fontFamily: `'${theme.bodyFont}', serif`,
            color: theme.textColor,
          }}
        >
          {recipe.description}
        </p>
      )}
      <div
        className="h-0.5 w-full rounded mb-4"
        style={{ backgroundColor: theme.dividerColor, opacity: 0.4 }}
      />

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="mb-4">
          <h3
            className="text-sm font-bold mb-2"
            style={{
              fontFamily: `'${theme.displayFont}', serif`,
              color: theme.headingColor,
            }}
          >
            Ingredients
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {ingredients.map((ing, i) => (
              <p
                key={i}
                className="text-[10px] leading-snug"
                style={{
                  fontFamily: `'${theme.bodyFont}', serif`,
                  color: theme.textColor,
                }}
              >
                {ing.quantity_text && <span className="font-semibold">{ing.quantity_text} </span>}
                {ing.unit && <span className="font-semibold">{ing.unit} </span>}
                {ing.ingredient_name}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {instructions.length > 0 && (
        <div>
          <h3
            className="text-sm font-bold mb-2"
            style={{
              fontFamily: `'${theme.displayFont}', serif`,
              color: theme.headingColor,
            }}
          >
            Instructions
          </h3>
          <div className="space-y-1.5">
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2">
                <span
                  className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  {idx + 1}
                </span>
                <p
                  className="text-[10px] leading-relaxed"
                  style={{
                    fontFamily: `'${theme.bodyFont}', serif`,
                    color: theme.textColor,
                  }}
                >
                  {inst.instruction_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StoryPage({ page, theme }) {
  const content = page.content || {}
  return (
    <div
      className="w-full aspect-[8.5/11] p-10 overflow-hidden"
      style={{ backgroundColor: theme.bgColor }}
    >
      <h2
        className="text-2xl mb-4"
        style={{
          fontFamily: `'${theme.displayFont}', serif`,
          color: theme.headingColor,
          fontWeight: 700,
        }}
      >
        {content.title || page.title || 'Story'}
      </h2>
      <p
        className="text-xs leading-relaxed whitespace-pre-wrap"
        style={{
          fontFamily: `'${theme.bodyFont}', serif`,
          color: theme.textColor,
        }}
      >
        {content.content || 'No story written yet.'}
      </p>
    </div>
  )
}

function BlankPage({ theme }) {
  return (
    <div
      className="w-full aspect-[8.5/11]"
      style={{ backgroundColor: theme.bgColor }}
    />
  )
}

function PageRenderer({ page, cookbook, recipes, theme }) {
  switch (page.page_type) {
    case 'cover':
      return <CoverPage cookbook={cookbook} theme={theme} />
    case 'dedication':
      return <DedicationPage page={page} theme={theme} />
    case 'family_history':
      return <FamilyHistoryPage page={page} theme={theme} />
    case 'section_divider':
      return <SectionDividerPage page={page} theme={theme} />
    case 'recipe':
      return <RecipePage page={page} recipes={recipes} theme={theme} />
    case 'story':
      return <StoryPage page={page} theme={theme} />
    case 'blank':
      return <BlankPage theme={theme} />
    default:
      return <BlankPage theme={theme} />
  }
}

export default function CookbookPreview({ cookbook, pages, recipes, themeId }) {
  const theme = COOKBOOK_THEMES[themeId] || COOKBOOK_THEMES.farmhouse
  const [currentPage, setCurrentPage] = useState(0)

  // Build displayable pages: cover + all pages
  const allPages = [
    { id: 'cover', page_type: 'cover', title: 'Cover' },
    ...pages,
  ]

  const totalPages = allPages.length

  return (
    <div className="flex flex-col items-center">
      {/* Page display */}
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-xl border border-stone/10 overflow-hidden">
          <PageRenderer
            page={allPages[currentPage]}
            cookbook={cookbook}
            recipes={recipes}
            theme={theme}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-2 rounded-lg bg-linen text-sunday-brown hover:bg-stone/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-body text-stone">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="p-2 rounded-lg bg-linen text-sunday-brown hover:bg-stone/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
