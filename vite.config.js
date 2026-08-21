import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path para publicação no GitHub Pages: https://<usuario>.github.io/notion-ponto-app/
// Se o repositório for renomeado, atualize este valor de acordo.
export default defineConfig({
  base: '/notion-ponto-app/',
  plugins: [react()],
})
