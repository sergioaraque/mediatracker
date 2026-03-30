import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // In dev, always serve /config.js as valid JS with no-cache headers.
    // In production the real config.js is written by docker-entrypoint.sh.
    {
      name: 'dev-config-js',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/config.js') {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end('window.__APP_CONFIG__ = {};')
            return
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: { '@': resolve(__dirname, './src') }
  }
})
