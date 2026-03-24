import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Register Google Fonts
Font.register({
  family: 'Playfair Display',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2rA0s.ttf',
  fontWeight: 700,
})

Font.register({
  family: 'Lora',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq0.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkq0.ttf',
      fontWeight: 600,
    },
  ],
})

Font.register({
  family: 'Caveat',
  src: 'https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9SIKjYBxPigs.ttf',
  fontWeight: 400,
})

// Brand colors
const colors = {
  cream: '#FDF6EE',
  linen: '#F5EDDF',
  sundayBrown: '#6B4C3B',
  sienna: '#C75B39',
  honey: '#D4A44C',
  castIron: '#3D3029',
  herb: '#5B7B5A',
  tomato: '#C4463A',
  butter: '#E8C84A',
  flour: '#FFFFFF',
  stone: '#9B8E82',
  sage: '#A8B5A0',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: colors.flour,
    fontFamily: 'Lora',
    fontSize: 11,
    color: colors.sundayBrown,
  },
  // Header
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 28,
    fontWeight: 700,
    color: colors.castIron,
    marginBottom: 4,
  },
  cookAttribution: {
    fontFamily: 'Caveat',
    fontSize: 16,
    color: colors.sienna,
    marginBottom: 16,
  },
  description: {
    fontSize: 11,
    color: colors.sundayBrown,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  // Meta row
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C8',
  },
  metaBadge: {
    backgroundColor: colors.linen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 600,
    color: colors.sundayBrown,
  },
  // Sections
  sectionHeading: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 700,
    color: colors.castIron,
    marginBottom: 10,
    marginTop: 4,
  },
  // Ingredients
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  ingredientCol: {
    width: '50%',
    paddingRight: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E0D6',
  },
  ingredientQty: {
    fontWeight: 600,
    fontSize: 10,
    color: colors.castIron,
  },
  ingredientName: {
    fontSize: 10,
    color: colors.sundayBrown,
  },
  ingredientNotes: {
    fontSize: 9,
    color: colors.stone,
  },
  // Instructions
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.sienna,
    color: colors.flour,
    fontSize: 10,
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1,
    paddingTop: 5,
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: colors.sundayBrown,
    lineHeight: 1.6,
    paddingTop: 2,
  },
  // Notes
  notesBox: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.stone,
    borderRadius: 6,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  notesHeading: {
    fontFamily: 'Playfair Display',
    fontSize: 14,
    fontWeight: 700,
    color: colors.castIron,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 10,
    color: colors.sundayBrown,
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#D5CCC3',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.stone,
  },
  // Decorative divider
  divider: {
    height: 2,
    backgroundColor: colors.honey,
    marginVertical: 12,
    borderRadius: 1,
    opacity: 0.5,
  },
})

function formatLabel(str) {
  if (!str) return ''
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function RecipePDFTemplate({ recipe, ingredients, cookName }) {
  const instructions = (recipe?.recipe_instructions || [])
    .sort((a, b) => (a.sort_order ?? a.step_number ?? 0) - (b.sort_order ?? b.step_number ?? 0))

  const sortedIngredients = (ingredients || [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  // Split ingredients into two columns
  const midpoint = Math.ceil(sortedIngredients.length / 2)
  const col1 = sortedIngredients.slice(0, midpoint)
  const col2 = sortedIngredients.slice(midpoint)

  const metaBadges = []
  if (recipe?.category) metaBadges.push(formatLabel(recipe.category))
  if (recipe?.cuisine) metaBadges.push(formatLabel(recipe.cuisine))
  if (recipe?.difficulty) metaBadges.push(formatLabel(recipe.difficulty))
  if (recipe?.prep_time_minutes) metaBadges.push(`Prep: ${recipe.prep_time_minutes} min`)
  if (recipe?.cook_time_minutes) metaBadges.push(`Cook: ${recipe.cook_time_minutes} min`)
  if (recipe?.servings) metaBadges.push(`Serves ${recipe.servings}`)

  const renderIngredient = (ing) => {
    const parts = []
    if (ing.quantity_text) parts.push(ing.quantity_text)
    if (ing.unit) parts.push(ing.unit)
    const qtyText = parts.length > 0 ? parts.join(' ') + ' ' : ''

    return (
      <View key={ing.id} style={styles.ingredientItem}>
        <Text>
          {qtyText && <Text style={styles.ingredientQty}>{qtyText}</Text>}
          <Text style={styles.ingredientName}>{ing.ingredient_name}</Text>
          {ing.notes && <Text style={styles.ingredientNotes}> ({ing.notes})</Text>}
        </Text>
      </View>
    )
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>{recipe?.title || 'Untitled Recipe'}</Text>

        {/* Cook attribution */}
        {cookName && (
          <Text style={styles.cookAttribution}>A recipe by {cookName}</Text>
        )}

        {/* Description */}
        {recipe?.description && (
          <Text style={styles.description}>{recipe.description}</Text>
        )}

        {/* Decorative divider */}
        <View style={styles.divider} />

        {/* Meta badges */}
        {metaBadges.length > 0 && (
          <View style={styles.metaRow}>
            {metaBadges.map((badge, i) => (
              <Text key={i} style={styles.metaBadge}>
                {badge}
              </Text>
            ))}
          </View>
        )}

        {/* Ingredients */}
        {sortedIngredients.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Ingredients</Text>
            <View style={styles.ingredientsGrid}>
              <View style={styles.ingredientCol}>
                {col1.map(renderIngredient)}
              </View>
              <View style={styles.ingredientCol}>
                {col2.map(renderIngredient)}
              </View>
            </View>
          </View>
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Instructions</Text>
            {instructions.map((inst, idx) => (
              <View key={inst.id || idx} style={styles.instructionItem} wrap={false}>
                <Text style={styles.stepNumber}>{idx + 1}</Text>
                <Text style={styles.stepText}>{inst.instruction_text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {recipe?.notes && (
          <View style={styles.notesBox} wrap={false}>
            <Text style={styles.notesHeading}>Notes</Text>
            <Text style={styles.notesText}>{recipe.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Sunday Dinner Memories — sundaydinnermemories.com
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
