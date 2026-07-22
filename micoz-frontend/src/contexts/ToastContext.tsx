// 토스트 전역 상태 — show(message) 로 어디서든 알림. Toast 렌더는 Provider 가 담당.
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import Toast from '../components/ui/Toast'

type ToastContextValue = {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  const show = useCallback((message: string) => setState({ show: true, message }), [])
  const close = useCallback(() => setState((s) => ({ ...s, show: false })), [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toast show={state.show} message={state.message} onClose={close} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
