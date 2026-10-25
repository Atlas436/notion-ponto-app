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
          bg: 'rgb(var(--cozy-bg) / <alpha-value>)',
          panel: 'rgb(var(--cozy-panel) / <alpha-value>)',
          border: 'rgb(var(--cozy-border) / <alpha-value>)',
          text: 'rgb(var(--cozy-text) / <alpha-value>)',
          muted: 'rgb(var(--cozy-muted) / <alpha-value>)',
          accent: 'rgb(var(--cozy-accent) / <alpha-value>)',
          extra: 'rgb(var(--cozy-extra) / <alpha-value>)',
          holiday: 'rgb(var(--cozy-holiday) / <alpha-value>)',
          weekend: 'rgb(var(--cozy-weekend) / <alpha-value>)',
          holidayBg: 'rgb(var(--cozy-holidayBg) / <alpha-value>)',
          sage: 'rgb(var(--cozy-sage) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
