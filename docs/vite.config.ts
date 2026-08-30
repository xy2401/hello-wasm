import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [{
    name: 'hello-wasm-local-cross-origin-headers',
    configureServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
        next()
      })
    },
  }],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
})
