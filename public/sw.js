const CACHE_NAME = 'taskr-v3'

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Clear ALL old caches on activate
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  // Never cache - always go to network
  // Service worker only exists for push notifications
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Offline', { status: 503 })
  }))
})

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'taskr'
  const options = {
    body: data.body || 'You have tasks due.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'taskr-notification',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      const url = event.notification.data?.url || '/'
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
