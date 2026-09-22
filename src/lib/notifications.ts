import { api } from './apiClient'

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const bytes = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i)
  return bytes.buffer
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

export async function enablePushNotifications(): Promise<{ ok: boolean; reason?: string }> {
  if (isIos && !isStandalone()) {
    return {
      ok: false,
      reason: 'No iPhone, notificação só funciona com o app adicionado à Tela de Início (compartilhar → Adicionar à Tela de Início) — não funciona direto pelo Safari.',
    }
  }

  if (!isPushSupported()) return { ok: false, reason: 'Navegador sem suporte a notificação push.' }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, reason: 'Permissão de notificação negada.' }

    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado esperando o service worker.')), 10_000)),
    ])

    const { publicKey } = await api.get<{ publicKey: string }>('/vapid-public-key')

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }

    await api.post('/push-subscribe', subscription.toJSON())
    return { ok: true }
  } catch (err) {
    console.error('enablePushNotifications falhou', err)
    return { ok: false, reason: err instanceof Error ? err.message : 'Erro desconhecido ao ativar notificações.' }
  }
}

export async function getNotificationPermissionState(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
