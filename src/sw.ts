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
  medicationId?: number
  url?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = { title: 'Metamorfa', body: 'Você tem um lembrete.' }
  try {
    if (event.data) data = event.data.json()
  } catch {
    // payload não era JSON, mantém o fallback
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
      tag: data.medicationId ? `med-${data.medicationId}` : undefined,
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

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
