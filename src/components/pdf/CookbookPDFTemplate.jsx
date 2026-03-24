import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Register all theme fonts
Font.register({
  family: 'Playfair Display',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2rA0s.ttf',
  fontWeight: 700,
})

Font.register({
  family: 'Lora',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq0.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkq0.ttf', fontWeight: 600 },
  ],
})

Font.register({
  family: 'Caveat',
  src: 'https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9SIKjYBxPigs.ttf',
  fontWeight: 400,
})

Font.register({
  family: 'Merriweather',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5OeyxNV-bnrw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/merriweather/v30/u-4n0qyriQwlOrhSvowK_l52xwNZVcf6hPvhPUWH.ttf', fontWeight: 700 },
  ],
})

// Theme color maps for PDF
const themeColors = {
  farmhouse: {
    bg: '#FDF6EE', text: '#6B4C3B', heading: '#3D3029',
    accent: '#C75B39', divider: '#D4A44C',
    displayFont: 'Playfair Display', bodyFont: 'Lora',
  },
  rustic: {
    bg: '#F0E6D6', text: '#4A3728', heading: '#3B2517',
    accent: '#5B3A29', divider: '#8B6F47',
    displayFont: 'Playfair Display', bodyFont: 'Lora',
  },
  modern: {
    bg: '#FFFFFF', text: '#333333', heading: '#1A1A1A',
    accent: '#E85D3A', divider: '#E85D3A',
    displayFont: 'Merriweather', bodyFont: 'Lora',
  },
  minimalist: {
    bg: '#FFFFFF', text: '#333333', heading: '#000000',
    accent: '#000000', divider: '#CCCCCC',
    displayFont: 'Lora', bodyFont: 'Lora',
  },
  vintage: {
    bg: '#F5EDD8', text: '#5A4632', heading: '#3D2B1F',
    accent: '#8B4513', divider: '#C4A265',
    displayFont: 'Playfair Display', bodyFont: 'Lora',
  },
  classic: {
    bg: '#FAFAF8', text: '#444444', heading: '#222222',
    accent: '#8B0000', divider: '#8B0000',
    displayFont: 'Merriweather', bodyFont: 'Merriweather',
  },
}

function getTheme(themeId) {
  return themeColors[themeId] || themeColors.farmhouse
}

function makeStyles(t) {
  return StyleSheet.create({
    page: {
      paddingTop: 50, paddingBottom: 60, paddingHorizontal: 50,
      backgroundColor: t.bg, fontFamily: t.bodyFont, fontSize: 11, color: t.text,
    },
    coverPage: {
      paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0,
      backgroundColor: t.bg, fontFamily: t.bodyFont,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    },
    coverTitle: {
      fontFamily: t.displayFont, fontSize: 36, fontWeight: 700,
      color: t.heading, textAlign: 'center', marginBottom: 8,
    },
    coverSubtitle: {
      fontFamily: t.bodyFont, fontSize: 16, color: t.text,
      textAlign: 'center', marginBottom: 16,
    },
    divider: {
      height: 2, backgroundColor: t.divider, marginVertical: 12,
      borderRadius: 1, opacity: 0.5, width: 80, alignSelf: 'center',
    },
    sectionTitle: {
      fontFamily: t.displayFont, fontSize: 28, fontWeight: 700,
      color: t.heading, textAlign: 'center', marginBottom: 8,
    },
    sectionDesc: {
      fontFamily: t.bodyFont, fontSize: 12, color: t.text,
      textAlign: 'center', maxWidth: 300,
    },
    recipeTitle: {
      fontFamily: t.displayFont, fontSize: 24, fontWeight: 700,
      color: t.heading, marginBottom: 4,
    },
    recipeCook: {
      fontFamily: 'Caveat', fontSize: 14, color: t.accent, marginBottom: 12,
    },
    recipeDesc: {
      fontSize: 11, color: t.text, marginBottom: 12, lineHeight: 1.5,
    },
    heading: {
      fontFamily: t.displayFont, fontSize: 16, fontWeight: 700,
      color: t.heading, marginBottom: 8, marginTop: 4,
    },
    ingredientRow: {
      flexDirection: 'row', paddingVertical: 2,
      borderBottomWidth: 0.5, borderBottomColor: '#E8E0D6',
    },
    ingredientQty: { fontWeight: 600, fontSize: 10, color: t.heading },
    ingredientName: { fontSize: 10, color: t.text },
    ingredientNotes: { fontSize: 9, color: '#9B8E82' },
    instructionRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
    stepNumber: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: t.accent, color: '#FFFFFF',
      fontSize: 10, fontWeight: 600, textAlign: 'center',
      lineHeight: 1, paddingTop: 5,
    },
    stepText: { flex: 1, fontSize: 11, color: t.text, lineHeight: 1.6, paddingTop: 2 },
    storyTitle: {
      fontFamily: t.displayFont, fontSize: 22, fontWeight: 700,
      color: t.heading, marginBottom: 12,
    },
    storyText: { fontSize: 11, color: t.text, lineHeight: 1.7 },
    dedicationText: {
      fontFamily: 'Caveat', fontSize: 18, color: t.text,
      textAlign: 'center', lineHeight: 1.8,
    },
    tocTitle: {
      fontFamily: t.displayFont, fontSize: 24, fontWeight: 700,
      color: t.heading, marginBottom: 20, textAlign: 'center',
    },
    tocItem: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#E0D5C8',
    },
    tocItemText: { fontSize: 11, color: t.text },
    tocItemPage: { fontSize: 11, color: '#9B8E82' },
    footer: {
      position: 'absolute', bottom: 30, left: 50, right: 50,
      flexDirection: 'row', justifyContent: 'space-between',
      borderTopWidth: 0.5, borderTopColor: '#D5CCC3', paddingTop: 8,
    },
    footerText: { fontSize: 8, color: '#9B8E82' },
    indexTitle: {
      fontFamily: t.displayFont, fontSize: 20, fontWeight: 700,
      color: t.heading, marginBottom: 16,
    },
    indexItem: { fontSize: 9, color: t.text, marginBottom: 2 },
  })
}

function formatLabel(str) {
  if (!str) return ''
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function Footer({ styles }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Sunday Dinner Memories</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber }) => `${pageNumber}`}
      />
    </View>
  )
}

function CoverPDFPage({ cookbook, styles, t }) {
  return (
    <Page size="LETTER" style={styles.coverPage}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 50 }}>
        {cookbook.cover_image_url && (
          <Image src={cookbook.cover_image_url} style={{ width: 200, height: 200, marginBottom: 30, borderRadius: 8 }} />
        )}
        <Text style={styles.coverTitle}>{cookbook.title || 'Untitled Cookbook'}</Text>
        {cookbook.subtitle && <Text style={styles.coverSubtitle}>{cookbook.subtitle}</Text>}
        <View style={styles.divider} />
      </View>
    </Page>
  )
}

function DedicationPDFPage({ page, styles }) {
  const content = page.content || {}
  if (!content.text) return null
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={styles.dedicationText}>{content.text}</Text>
      </View>
      <Footer styles={styles} />
    </Page>
  )
}

function FamilyHistoryPDFPage({ page, styles }) {
  const content = page.content || {}
  if (!content.text) return null
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.storyTitle}>Our Family Story</Text>
      <Text style={styles.storyText}>{content.text}</Text>
      <Footer styles={styles} />
    </Page>
  )
}

function TOCPDFPage({ pages, recipes, styles }) {
  const tocItems = pages
    .filter((p) => p.page_type === 'recipe' || p.page_type === 'section_divider' || p.page_type === 'story')
    .map((p) => {
      if (p.page_type === 'recipe') {
        const recipe = recipes.find((r) => r.id === p.content?.recipe_id)
        return { title: recipe?.title || 'Recipe', type: 'recipe' }
      }
      if (p.page_type === 'section_divider') {
        return { title: p.content?.title || p.title || 'Section', type: 'section' }
      }
      return { title: p.content?.title || p.title || 'Story', type: 'story' }
    })

  if (tocItems.length === 0) return null

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.tocTitle}>Table of Contents</Text>
      {tocItems.map((item, i) => (
        <View key={i} style={styles.tocItem}>
          <Text style={[styles.tocItemText, item.type === 'section' && { fontWeight: 600 }]}>
            {item.type === 'section' ? `-- ${item.title} --` : item.title}
          </Text>
        </View>
      ))}
      <Footer styles={styles} />
    </Page>
  )
}

function SectionDividerPDFPage({ page, styles }) {
  const content = page.content || {}
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{content.title || page.title || 'Section'}</Text>
        {content.description && <Text style={styles.sectionDesc}>{content.description}</Text>}
        <View style={[styles.divider, { marginTop: 16 }]} />
      </View>
      <Footer styles={styles} />
    </Page>
  )
}

function RecipePDFPage({ page, recipes, styles }) {
  const content = page.content || {}
  const recipe = recipes.find((r) => r.id === content.recipe_id)
  if (!recipe) return null

  const ingredients = (recipe.recipe_ingredients || []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const instructions = (recipe.recipe_instructions || []).sort(
    (a, b) => (a.sort_order ?? a.step_number ?? 0) - (b.sort_order ?? b.step_number ?? 0)
  )

  const metaBadges = []
  if (recipe.category) metaBadges.push(formatLabel(recipe.category))
  if (recipe.cuisine) metaBadges.push(formatLabel(recipe.cuisine))
  if (recipe.prep_time_minutes) metaBadges.push(`Prep: ${recipe.prep_time_minutes} min`)
  if (recipe.cook_time_minutes) metaBadges.push(`Cook: ${recipe.cook_time_minutes} min`)
  if (recipe.servings) metaBadges.push(`Serves ${recipe.servings}`)

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.recipeTitle}>{recipe.title}</Text>
      {recipe.cook_name && recipe.cook_name !== 'Unknown' && (
        <Text style={styles.recipeCook}>A recipe by {recipe.cook_name}</Text>
      )}
      {recipe.description && <Text style={styles.recipeDesc}>{recipe.description}</Text>}

      {metaBadges.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {metaBadges.map((b, i) => (
            <Text key={i} style={{ fontSize: 9, backgroundColor: '#F5EDDF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
              {b}
            </Text>
          ))}
        </View>
      )}

      {ingredients.length > 0 && (
        <View>
          <Text style={styles.heading}>Ingredients</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            <View style={{ width: '50%', paddingRight: 10 }}>
              {ingredients.slice(0, Math.ceil(ingredients.length / 2)).map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text>
                    {ing.quantity_text && <Text style={styles.ingredientQty}>{ing.quantity_text} </Text>}
                    {ing.unit && <Text style={styles.ingredientQty}>{ing.unit} </Text>}
                    <Text style={styles.ingredientName}>{ing.ingredient_name}</Text>
                    {ing.notes && <Text style={styles.ingredientNotes}> ({ing.notes})</Text>}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ width: '50%', paddingLeft: 10 }}>
              {ingredients.slice(Math.ceil(ingredients.length / 2)).map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text>
                    {ing.quantity_text && <Text style={styles.ingredientQty}>{ing.quantity_text} </Text>}
                    {ing.unit && <Text style={styles.ingredientQty}>{ing.unit} </Text>}
                    <Text style={styles.ingredientName}>{ing.ingredient_name}</Text>
                    {ing.notes && <Text style={styles.ingredientNotes}> ({ing.notes})</Text>}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {instructions.length > 0 && (
        <View>
          <Text style={styles.heading}>Instructions</Text>
          {instructions.map((inst, idx) => (
            <View key={idx} style={styles.instructionRow} wrap={false}>
              <Text style={styles.stepNumber}>{idx + 1}</Text>
              <Text style={styles.stepText}>{inst.instruction_text}</Text>
            </View>
          ))}
        </View>
      )}

      {recipe.notes && (
        <View style={{ backgroundColor: '#FDF6EE', border: '1px solid #9B8E82', borderRadius: 6, padding: 12, marginTop: 10 }} wrap={false}>
          <Text style={[styles.heading, { marginTop: 0, fontSize: 13 }]}>Notes</Text>
          <Text style={{ fontSize: 10, color: '#6B4C3B', lineHeight: 1.6 }}>{recipe.notes}</Text>
        </View>
      )}

      <Footer styles={styles} />
    </Page>
  )
}

function StoryPDFPage({ page, styles }) {
  const content = page.content || {}
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.storyTitle}>{content.title || page.title || 'Story'}</Text>
      <Text style={styles.storyText}>{content.content || ''}</Text>
      <Footer styles={styles} />
    </Page>
  )
}

function BlankPDFPage({ styles }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Footer styles={styles} />
    </Page>
  )
}

function IngredientIndexPage({ pages, recipes, styles }) {
  // Build ingredient -> recipe title map
  const ingredientMap = {}
  for (const page of pages) {
    if (page.page_type !== 'recipe') continue
    const recipe = recipes.find((r) => r.id === page.content?.recipe_id)
    if (!recipe) continue
    for (const ing of recipe.recipe_ingredients || []) {
      const name = ing.ingredient_name?.toLowerCase().trim()
      if (!name) continue
      if (!ingredientMap[name]) ingredientMap[name] = []
      if (!ingredientMap[name].includes(recipe.title)) {
        ingredientMap[name].push(recipe.title)
      }
    }
  }

  const sorted = Object.keys(ingredientMap).sort()
  if (sorted.length === 0) return null

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.indexTitle}>Index by Ingredient</Text>
      {sorted.map((ing) => (
        <Text key={ing} style={styles.indexItem}>
          {ing.charAt(0).toUpperCase() + ing.slice(1)} — {ingredientMap[ing].join(', ')}
        </Text>
      ))}
      <Footer styles={styles} />
    </Page>
  )
}

function CookIndexPage({ pages, recipes, styles }) {
  const cookMap = {}
  for (const page of pages) {
    if (page.page_type !== 'recipe') continue
    const recipe = recipes.find((r) => r.id === page.content?.recipe_id)
    if (!recipe) continue
    const cook = recipe.cook_name || 'Unknown'
    if (!cookMap[cook]) cookMap[cook] = []
    cookMap[cook].push(recipe.title)
  }

  const sorted = Object.keys(cookMap).sort()
  if (sorted.length === 0) return null

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.indexTitle}>Index by Cook</Text>
      {sorted.map((cook) => (
        <View key={cook} style={{ marginBottom: 8 }}>
          <Text style={[styles.indexItem, { fontWeight: 600, fontSize: 11 }]}>{cook}</Text>
          {cookMap[cook].map((title, i) => (
            <Text key={i} style={[styles.indexItem, { paddingLeft: 12 }]}>{title}</Text>
          ))}
        </View>
      ))}
      <Footer styles={styles} />
    </Page>
  )
}

export default function CookbookPDFTemplate({ cookbook, pages, recipes, themeId, format }) {
  const t = getTheme(themeId)
  const styles = makeStyles(t)
  const isPrintReady = format === 'print'

  return (
    <Document>
      {/* Cover */}
      <CoverPDFPage cookbook={cookbook} styles={styles} t={t} />

      {/* Dedication (if any) */}
      {pages
        .filter((p) => p.page_type === 'dedication')
        .map((p) => (
          <DedicationPDFPage key={p.id} page={p} styles={styles} />
        ))}

      {/* Family History (if any) */}
      {pages
        .filter((p) => p.page_type === 'family_history')
        .map((p) => (
          <FamilyHistoryPDFPage key={p.id} page={p} styles={styles} />
        ))}

      {/* Table of Contents */}
      <TOCPDFPage pages={pages} recipes={recipes} styles={styles} />

      {/* Content pages (in order) */}
      {pages
        .filter((p) => !['dedication', 'family_history'].includes(p.page_type))
        .map((page) => {
          switch (page.page_type) {
            case 'section_divider':
              return <SectionDividerPDFPage key={page.id} page={page} styles={styles} />
            case 'recipe':
              return <RecipePDFPage key={page.id} page={page} recipes={recipes} styles={styles} />
            case 'story':
              return <StoryPDFPage key={page.id} page={page} styles={styles} />
            case 'blank':
              return <BlankPDFPage key={page.id} styles={styles} />
            default:
              return null
          }
        })}

      {/* Ingredient Index */}
      <IngredientIndexPage pages={pages} recipes={recipes} styles={styles} />

      {/* Cook Index */}
      <CookIndexPage pages={pages} recipes={recipes} styles={styles} />
    </Document>
  )
}
