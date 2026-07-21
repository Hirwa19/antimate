self.addEventListener("push", (event) => {
  let data = {
    title: "Smart Brooder Alert",
    body: "New brooder notification",
  };

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: "/vite.svg",
    badge: "/vite.svg",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow("/")
  );
});