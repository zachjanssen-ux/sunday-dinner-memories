/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF6EE',
        linen: '#F5EDDF',
        'sunday-brown': '#6B4C3B',
        sienna: '#C75B39',
        honey: '#D4A44C',
        'cast-iron': '#3D3029',
        herb: '#5B7B5A',
        tomato: '#C4463A',
        butter: '#E8C84A',
        flour: '#FFFFFF',
        stone: '#9B8E82',
        sage: '#A8B5A0',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        handwritten: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}
