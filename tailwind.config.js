/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta cozy/lo-fi: lavanda, sálvia e terracota sobre um branco levemente aconchegante.
        cozy: {
          bg: '#FAF7FC',
          panel: '#FFFFFF',
          border: '#E8E1F0',
          text: '#453C4E',
          muted: '#8C8296',
          accent: '#7C5CBF',
          extra: '#B85C3F',
          holiday: '#9B5C8F',
          weekend: '#EFF3E9',
          holidayBg: '#FBEAF2',
          sage: '#5B7A52',
        },
      },
    },
  },
  plugins: [],
}
