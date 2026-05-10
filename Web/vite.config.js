import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Change this to your ESP32-P4 IP when running npm run dev.
const P4_TARGET = process.env.P4_TARGET || 'http://192.168.5.210';

export default defineConfig({
  plugins: [vue()],

  server: {
    proxy: {
      '/api': {
        target: P4_TARGET,
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Prevent CSS splitting
    cssCodeSplit: false,

    // Make output filenames stable and reduce chunk count
    rollupOptions: {
      output: {
        codeSplitting: false,

        // Single JS bundle
        entryFileNames: 'assets/app.js',

        // Any remaining chunks
        chunkFileNames: 'assets/[name].js',

        // CSS and other assets
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/index.css';
          }

          return 'assets/[name][extname]';
        },
      },
    },
  },
});
