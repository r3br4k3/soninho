self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', async (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'SHOW_REMINDER') {
    await self.registration.showNotification('SONINHOS', {
      body: 'Bom dia! Registre seu sonho antes que os detalhes sumam.',
      tag: 'daily-dream-reminder',
      renotify: true
    });
  }
});
