/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 API origin (예: https://micoz-backend.onrender.com). dev 미설정 시 상대경로. */
  readonly VITE_API_BASE_URL?: string
}
