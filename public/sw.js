const CACHE_NAME = 'taskr-v2'
const STATIC_ASSETS = ['/', '/manifest.json']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
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
