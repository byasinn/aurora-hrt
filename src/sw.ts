/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  actions?: { action: string; title: string }[]
  data?: Record<string, unknown>
}

interface NotificationData {
  url?: string
  medicationId?: number
  scheduledFor?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = { title: 'Aurora', body: 'Você tem um lembrete.' }
  try {
    if (event.data) data = event.data.json()
  } catch {
    // payload não era JSON, mantém o fallback
  }

  // `actions` existe no Chrome/Android/desktop mas não está no tipo do lib.dom ainda
  const options: NotificationOptions & { actions?: PushPayload['actions'] } = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { ...data.data, url: data.url ?? '/' } satisfies NotificationData,
    tag: data.tag,
    actions: data.actions,
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Botões do "Você tomou?" (worker/scheduled.ts) — responde direto, sem abrir o app.
const DOSE_ACTIONS: Record<string, 'taken' | 'skipped'> = { 'dose-taken': 'taken', 'dose-skipped': 'skipped' }

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const data = (event.notification.data as NotificationData | undefined) ?? {}
  const doseStatus = DOSE_ACTIONS[event.action]

  if (doseStatus && data.medicationId != null && data.scheduledFor) {
    event.waitUntil(
      fetch('/api/doses/respond', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ medicationId: data.medicationId, scheduledFor: data.scheduledFor, status: doseStatus }),
      })
        .then(async (res) => {
          // sessão expirada ou erro — abre o app pra pessoa marcar por lá
          if (!res.ok) await self.clients.openWindow('/')
        })
        .catch(() => self.clients.openWindow('/')),
    )
    return
  }

  const url = data.url ?? '/'

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = clientsList.find((c) => 'focus' in c)
      if (existing) {
        await (existing as WindowClient).focus()
        existing.postMessage({ type: 'navigate', url })
      } else {
        await self.clients.openWindow(url)
      }
    })(),
  )
})
