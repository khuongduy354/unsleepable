// Service Worker for Push Notifications
// This file handles push notification events

console.log("[Service Worker] Loaded");

self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating...");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push received:", event);

  if (event.data) {
    try {
      const data = event.data.json();
      console.log("[Service Worker] Push data:", data);

      const options = {
        body: data.body,
        icon: data.icon || "/icon.png",
        badge: data.badge || "/badge.png",
        data: data.data || {},
        requireInteraction: false,
        tag: "notification-" + Date.now(),
      };

      // Show the notification
      event.waitUntil(
        self.registration
          .showNotification(data.title, options)
          .then(() => {
            console.log("[Service Worker] Notification shown");
            // Post message to all clients to update in-app notifications
            return self.clients.matchAll({ type: "window" });
          })
          .then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "PUSH_NOTIFICATION",
                payload: {
                  title: data.title,
                  body: data.body,
                  data: data.data || {},
                },
              });
            });
          })
          .catch((err) =>
            console.error("[Service Worker] Notification error:", err)
          )
      );
    } catch (error) {
      console.error("[Service Worker] Error parsing push data:", error);
    }
  } else {
    console.log("[Service Worker] Push event has no data");
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification clicked");
  event.notification.close();

  // Handle notification click - you can navigate to a specific page
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
