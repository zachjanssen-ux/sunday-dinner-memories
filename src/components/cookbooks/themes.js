// Cookbook theme definitions
// Each theme has display fonts, body fonts, colors, and descriptive metadata.

export const COOKBOOK_THEMES = {
  farmhouse: {
    id: 'farmhouse',
    name: 'Farmhouse',
    description: 'Warm and welcoming, like a kitchen on Sunday morning.',
    displayFont: 'Playfair Display',
    bodyFont: 'Lora',
    accentColor: '#C75B39', // sienna
    bgColor: '#FDF6EE',     // cream
    textColor: '#6B4C3B',   // sunday-brown
    headingColor: '#3D3029', // cast-iron
    dividerColor: '#D4A44C', // honey
    sampleTitle: 'Grandma\'s Apple Pie',
    sampleSubtitle: 'A recipe by Martha',
  },
  rustic: {
    id: 'rustic',
    name: 'Rustic',
    description: 'Earthy and bold, like a hand-hewn farmhouse table.',
    displayFont: 'Abril Fatface',
    bodyFont: 'Source Serif Pro',
    accentColor: '#5B3A29',
    bgColor: '#F0E6D6',
    textColor: '#4A3728',
    headingColor: '#3B2517',
    dividerColor: '#8B6F47',
    sampleTitle: 'Grandma\'s Apple Pie',
    sampleSubtitle: 'A recipe by Martha',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines and bold type for the contemporary cook.',
    displayFont: 'Montserrat',
    bodyFont: 'Inter',
    accentColor: '#E85D3A',
    bgColor: '#FFFFFF',
    textColor: '#333333',
    headingColor: '#1A1A1A',
    dividerColor: '#E85D3A',
    sampleTitle: 'Grandma\'s Apple Pie',
    sampleSubtitle: 'A recipe by Martha',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Elegant simplicity. Let the recipes speak for themselves.',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Crimson Text',
    accentColor: '#000000',
    bgColor: '#FFFFFF',
    textColor: '#333333',
    headingColor: '#000000',
    dividerColor: '#CCCCCC',
    sampleTitle: 'Grandma\'s Apple Pie',
    sampleSubtitle: 'A recipe by Martha',
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Ornate and warm, like a treasured heirloom.',
    displayFont: 'Libre Baskerville',
    bodyFont: 'EB Garamond',
    accentColor: '#8B4513',
    bgColor: '#F5EDD8',
    textColor: '#5A4632',
    headingColor: '#3D2B1F',
    dividerColor: '#C4A265',
    sampleTitle: 'Grandma\'s Apple Pie',
    sampleSubtitle: 'A recipe by Martha',
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and refined. A cookbook that never goes out of style.',
    displayFont: 'Merriweather',
    bodyFont: 'Merriweather',
    accentColor: '#8B0000',
    bgColor: '#FAFAF8',
    textColor: '#444444',
    headingColor: '#222222',
    dividerColor: '#8B0000',
    sampleTitle: 'Grandma\'s Apple Pie',
    sampleSubtitle: 'A recipe by Martha',
  },
}

// Google font imports for themes not already loaded
export const THEME_FONT_IMPORTS = [
  'Playfair+Display:wght@700',
  'Lora:wght@400;600',
  'Caveat:wght@400;700',
  'Abril+Fatface',
  'Source+Serif+Pro:wght@400;600',
  'Montserrat:wght@400;600;700',
  'Inter:wght@400;500;600',
  'Cormorant+Garamond:wght@400;600;700',
  'Crimson+Text:wght@400;600',
  'Libre+Baskerville:wght@400;700',
  'EB+Garamond:wght@400;500;600',
  'Merriweather:wght@400;700',
]

export function getThemeFontUrl() {
  return `https://fonts.googleapis.com/css2?${THEME_FONT_IMPORTS.map((f) => `family=${f}`).join('&')}&display=swap`
}
