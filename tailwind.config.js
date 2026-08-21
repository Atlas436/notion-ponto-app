/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cozy: {
          bg: '#FBFBFA',
          panel: '#FFFFFF',
          border: '#E9E9E7',
          text: '#37352F',
          muted: '#787774',
          accent: '#2383E2',
          extra: '#D9730D',
          weekend: '#F7F6F3',
        },
      },
    },
  },
  plugins: [],
}
