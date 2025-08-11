import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3111,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8111',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3111,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'thatopen': ['@thatopen/components', '@thatopen/fragments', '@thatopen/ui']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', '@thatopen/components', '@thatopen/fragments', '@thatopen/ui']
  },
  define: {
    // Enable for development debugging
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
