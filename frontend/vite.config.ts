import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@api': path.resolve(__dirname, './src/api'),
      '@store': path.resolve(__dirname, './src/store'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to Django dev server
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: process.env.BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
        // Split vendor chunks for better caching
        if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor'
        if (id.includes('react')) return 'react-vendor'
        if (id.includes('@tanstack')) return 'query-vendor'
        if (id.includes('recharts')) return 'chart-vendor'
        if (id.includes('react-hook-form') || id.includes('zod')) return 'form-vendor'
        if (id.includes('lucide') || id.includes('date-fns')) return 'ui-vendor'
      },
      },
    },
  },
})
