import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:8788',
            changeOrigin: true,
          }
        }
      },
      plugins: [
        react(),
        tailwindcss(),
        visualizer()
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@components': path.resolve(__dirname, './components'),
          '@services': path.resolve(__dirname, './services'),
          '@utils': path.resolve(__dirname, './utils'),
          '@types': path.resolve(__dirname, './types'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: mode === 'development',
        minify: 'esbuild',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production',
          },
        },
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                return 'vendor';
              }
              if (id.includes('node_modules/lucide-react/')) {
                return 'ui';
              }
              if (id.includes('node_modules/@dnd-kit/')) {
                return 'dnd';
              }
            },
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
        // 减小 chunk 大小限制
        chunkSizeWarningLimit: 500,
        // 启用 Tree Shaking
        target: 'esnext',
      },
      optimizeDeps: {
        include: ['react', 'react-dom'],
      },
      css: {
        devSourcemap: true,
      },
      preview: {
        port: 4173,
      },
    };
});
