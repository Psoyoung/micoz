import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// MICOZ — Vite 설정. 레거시 원본(shop/, admin/, MICOZ-*.html)은 빌드에서 제외된다.
export default defineConfig({
  plugins: [react()],
  // /api → 백엔드(localhost:8080). axios baseURL '/api/v1' 와 합쳐져 :8080/api/v1/... 로 프록시.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 백엔드 CORS 가 dev 출처(localhost:517x)를 거부("Invalid CORS request" 403)하므로,
        // 프록시 단에서 Origin 을 백엔드 허용 출처(자기 자신 :8080)로 바꿔 통과시킨다(포트 무관).
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://localhost:8080')
          })
        },
      },
    },
  },
})
