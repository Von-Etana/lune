/// <reference lib="webworker" />

const CACHE_NAME = 'lune-cache-v1';
const RUNTIME_CACHE = 'lune-runtime-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Take control immediately
    (self as any).skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    // Take control of all clients immediately
    (self as any).clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests (except for CDN assets)
    if (url.origin !== location.origin && !url.hostname.includes('supabase')) {
        return;
    }

    // Skip API requests - always fetch fresh
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'You are offline. Please check your connection.' }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            })
        );
        return;
    }

    // For HTML pages - network first, fallback to cache
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Return offline page
                    return caches.match('/') || new Response('Offline', { status: 503 });
                })
        );
        return;
    }

    // For static assets - cache first, fallback to network
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached response and update cache in background
                fetch(request).then((response) => {
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, response);
                    });
                }).catch(() => { });
                return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(request).then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});

// Handle push notifications
self.addEventListener('push', (event: PushEvent) => {
    const data = event.data?.json() || {};

    // Use 'as any' to allow vibrate property which is supported but not in TS types
    const options = {
        body: data.body || 'New notification from Lune',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            timestamp: Date.now(),
        },
        actions: data.actions || [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
        tag: data.tag || 'lune-notification',
        renotify: true,
    } as NotificationOptions;

    event.waitUntil(
        (self as any).registration.showNotification(data.title || 'Lune', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        (self as any).clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients: any[]) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                return (self as any).clients.openWindow(urlToOpen);
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
    if (event.tag === 'sync-assessments') {
        event.waitUntil(syncPendingAssessments());
    }
});

async function syncPendingAssessments() {
    // Get pending assessments from IndexedDB and sync
    console.log('[ServiceWorker] Syncing pending assessments...');
    // Implementation would go here
}

// TypeScript declarations for service worker events
declare const self: ServiceWorkerGlobalScope;

interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
    request: Request;
    respondWith(response: Promise<Response> | Response): void;
}

interface PushEvent extends ExtendableEvent {
    data?: PushMessageData;
}

interface NotificationEvent extends ExtendableEvent {
    action: string;
    notification: Notification;
}

interface SyncEvent extends ExtendableEvent {
    tag: string;
    lastChance: boolean;
}
