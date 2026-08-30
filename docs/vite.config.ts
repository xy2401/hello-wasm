import { defineConfig } from 'vite'

function installRuntimeHeaders(server) {
  server.middlewares.use((request, response, next) => {
    const pathname = request.url?.split('?', 1)[0] ?? ''
    const gzipRuntimeAsset = pathname.startsWith('/runtime/') && pathname.endsWith('.gz')

    if (gzipRuntimeAsset) {
      const setHeader = response.setHeader.bind(response)
      response.setHeader = ((name, value) => {
        // Vite's static middleware identifies .gz as an HTTP content encoding.
        // These files are application data and must reach the browser compressed,
        // because the manifest hashes and sizes describe the gzip bytes themselves.
        if (String(name).toLowerCase() === 'content-encoding') return response
        return setHeader(name, value)
      })
      setHeader('Content-Type', 'application/octet-stream')
    }

    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    next()
  })
}

export default defineConfig({
  plugins: [{
    name: 'hello-wasm-local-cross-origin-headers',
    configureServer: installRuntimeHeaders,
    configurePreviewServer: installRuntimeHeaders,
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
