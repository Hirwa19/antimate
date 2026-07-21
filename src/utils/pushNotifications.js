import API from "../api/api";

const VAPID_PUBLIC_KEY =
  "BKmzs-hLWumGKI4IbAp7CojZ80y8s1DDzoSsK9LBoyIx74YwYTcQu5JZnYpwMJm67gIPGX60WZ3xqlJogfsuW40";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
}

export async function enablePushNotifications() {
  try {
    // browser support
    if (!("serviceWorker" in navigator)) {
      alert("Service Worker not supported");
      return;
    }

    if (!("PushManager" in window)) {
      alert("Push notifications not supported");
      return;
    }

    // ask permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Notification permission denied");
      return;
    }

    console.log("✅ Notification permission granted");

    // register SW
    const registration = await navigator.serviceWorker.register("/sw.js");

    console.log("✅ Service Worker registered");

    // wait SW ready
    await navigator.serviceWorker.ready;

    // existing subscription
    let subscription =
      await registration.pushManager.getSubscription();

    // create if none
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("✅ Push subscription created");
    } else {
      console.log("ℹ Existing subscription found");
    }

    console.log("📦 Subscription:", subscription);

    // save to backend
    await API.post("/push/subscribe", subscription);

    console.log("✅ Subscription saved to backend");

    alert("Push notifications enabled successfully ✅");
  } catch (err) {
    console.error("❌ Push notification error:", err);

    alert(
      err.message ||
        "Failed to enable push notifications"
    );
  }
}