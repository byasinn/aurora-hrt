import { useSyncExternalStore } from 'react'
import { ApiError } from './apiClient'

export interface ToastItem {
  id: number
  message: string
  variant: 'error' | 'info'
}

let toasts: ToastItem[] = []
const listeners = new Set<() => void>()
let nextId = 0

function emit() {
  for (const listener of listeners) listener()
}

export function showToast(message: string, variant: ToastItem['variant'] = 'error') {
  const id = nextId++
  toasts = [...toasts, { id, message, variant }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 4500)
}

/** Mostra a mensagem real do servidor (ex: limite de imagens, post muito frequente) em vez de um erro genérico. */
export function toastError(err: unknown, fallback = 'Algo deu errado. Tenta de novo.') {
  showToast(err instanceof ApiError ? err.message : fallback, 'error')
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => toasts,
  )
}
