const CACHE_NAME = 'cinnarito-v1';
const STATIC_CACHE_NAME = 'cinnarito-static-v1';
const DYNAMIC_CACHE_NAME = 'cinnarito-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/default-icon.png',
  '/assets/default-splash.png',
  '/assets/loading.gif',
  '/manifest.json'
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/init',
  '/api/state',
  '/api/plant',
  '/api/feed',
  '/api/charge',
  '/api/post'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle other requests with stale-while-revalidate strategy
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your connection.',
        cached: false
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch asset', error);
    throw error;
  }
}

// Stale-while-revalidate strategy for other resources
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('Service Worker: Background fetch failed', error);
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network response
  return networkResponsePromise;
}

// Background sync for failed API requests
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-actions') {
    event.waitUntil(syncFailedActions());
  }
});

// Sync failed actions when back online
async function syncFailedActions() {
  try {
    // Get failed actions from IndexedDB or localStorage
    const failedActions = await getFailedActions();
    
    for (const action of failedActions) {
      try {
        const response = await fetch(action.url, action.options);
        
        if (response.ok) {
          // Remove from failed actions
          await removeFailedAction(action.id);
          console.log('Service Worker: Synced failed action', action.id);
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync action', action.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Placeholder functions for failed action management
async function getFailedActions() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

async function removeFailedAction(id) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing failed action', id);
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'Your community garden has new updates!',
    icon: '/assets/default-icon.png',
    badge: '/assets/default-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Garden',
        icon: '/assets/default-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/default-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Cinnarito Community Garden', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_GAME_STATE') {
    // Cache game state for offline access
    cacheGameState(event.data.gameState);
  }
});

// Cache game state for offline access
async function cacheGameState(gameState) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(JSON.stringify(gameState), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    await cache.put('/api/cached-state', response);
    console.log('Service Worker: Game state cached for offline access');
  } catch (error) {
    console.error('Service Worker: Failed to cache game state', error);
  }
}