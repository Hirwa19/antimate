// =====================================================
// ANTIMATE SMART BROODER SERVICE WORKER
// =====================================================

// =====================================================
// INSTALL
// =====================================================

self.addEventListener("install", (event) => {
  console.log("🔧 ANTIMATE Service Worker installed");

  self.skipWaiting();
});

// =====================================================
// ACTIVATE
// =====================================================

self.addEventListener("activate", (event) => {
  console.log("🚀 ANTIMATE Service Worker activated");

  event.waitUntil(
    self.clients.claim()
  );
});

// =====================================================
// PUSH EVENT
// =====================================================

self.addEventListener("push", (event) => {
  console.log("📨 Push notification received");

  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error(
      "❌ Failed to parse push payload:",
      error
    );

    data = {
      title: "ANTIMATE Smart Brooder",
      body: event.data
        ? event.data.text()
        : "New brooder notification",
    };
  }

  const title =
    data.title ||
    "ANTIMATE Smart Brooder";

  const options = {
    body:
      data.body ||
      "New brooder notification",

    icon:
      data.icon ||
      "/icons/icon-192.png",

    badge:
      data.badge ||
      "/icons/badge-72.png",

    tag:
      data.tag ||
      "antimate-notification",

    renotify: true,

    requireInteraction:
      data.requireInteraction === true,

    vibrate: [
      200,
      100,
      200,
    ],

    data:
      data.data || {
        url: "/notifications",
      },
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

// =====================================================
// NOTIFICATION CLICK
// =====================================================

self.addEventListener(
  "notificationclick",
  (event) => {
    console.log(
      "👆 Notification clicked"
    );

    event.notification.close();

    const notificationData =
      event.notification.data || {};

    const targetUrl =
      notificationData.url ||
      "/notifications";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {

          // ============================================
          // FIND EXISTING APP WINDOW
          // ============================================

          for (const client of clientList) {
            if (
              client.url.includes(
                window.location.origin
              ) &&
              "focus" in client
            ) {
              client.navigate(targetUrl);
              return client.focus();
            }
          }

          // ============================================
          // OPEN NEW WINDOW
          // ============================================

          if (
            clients.openWindow
          ) {
            return clients.openWindow(
              targetUrl
            );
          }

          return null;
        })
    );
  }
);

// =====================================================
// NOTIFICATION CLOSE
// =====================================================

self.addEventListener(
  "notificationclose",
  (event) => {
    console.log(
      "🔕 Notification closed"
    );
  }
);