self.addEventListener("push", function (event) {
  console.log("📩 Push notification received");

  let data = {};

  try {
    data = event.data
      ? event.data.json()
      : {};
  } catch (error) {
    console.error(
      "Failed to parse push payload:",
      error
    );
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
      data.requireInteraction ||
      false,

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
  function (event) {
    event.notification.close();

    const url =
      event.notification?.data?.url ||
      "/notifications";

    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      }).then(function (clientList) {
        for (const client of clientList) {
          if (
            "focus" in client
          ) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (
          clients.openWindow
        ) {
          return clients.openWindow(
            url
          );
        }
      })
    );
  }
);