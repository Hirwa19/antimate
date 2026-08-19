const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY;

// =====================================================
// BASE64URL -> UINT8ARRAY
// =====================================================

function urlBase64ToUint8Array(
  base64String
) {
  const padding =
    "=".repeat(
      (4 -
        (base64String.length % 4)) %
        4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) => char.charCodeAt(0)
    )
  );
}

// =====================================================
// GET TOKEN
// =====================================================

function getToken() {
  return localStorage.getItem(
    "token"
  );
}

// =====================================================
// REGISTER SERVICE WORKER
// =====================================================

export async function registerPushServiceWorker() {
  if (
    !("serviceWorker" in navigator)
  ) {
    throw new Error(
      "Service Worker is not supported by this browser."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/sw.js"
    );

  await navigator.serviceWorker.ready;

  console.log(
    "✅ Push Service Worker ready"
  );

  return registration;
}

// =====================================================
// REQUEST NOTIFICATION PERMISSION
// =====================================================

export async function requestNotificationPermission() {
  if (
    !("Notification" in window)
  ) {
    throw new Error(
      "This browser does not support notifications."
    );
  }

  if (
    Notification.permission ===
    "granted"
  ) {
    return "granted";
  }

  if (
    Notification.permission ===
    "denied"
  ) {
    throw new Error(
      "Notifications are blocked in your browser settings."
    );
  }

  const permission =
    await Notification.requestPermission();

  if (
    permission !== "granted"
  ) {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  return permission;
}

// =====================================================
// GET BACKEND VAPID PUBLIC KEY
// =====================================================

async function getBackendPublicKey() {
  const token = getToken();

  const response =
    await fetch(
      `${API_URL}/api/notifications/push/public-key`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to get VAPID public key."
    );
  }

  return data.publicKey;
}

// =====================================================
// SUBSCRIBE
// =====================================================

export async function subscribeToPush() {
  const token = getToken();

  if (!token) {
    throw new Error(
      "User is not authenticated."
    );
  }

  // ================================================
  // SERVICE WORKER
  // ================================================

  const registration =
    await registerPushServiceWorker();

  // ================================================
  // PERMISSION
  // ================================================

  await requestNotificationPermission();

  // ================================================
  // PUBLIC KEY
  // ================================================

  const publicKey =
    VAPID_PUBLIC_KEY ||
    (await getBackendPublicKey());

  if (!publicKey) {
    throw new Error(
      "VAPID public key is missing."
    );
  }

  // ================================================
  // EXISTING SUBSCRIPTION
  // ================================================

  let subscription =
    await registration.pushManager.getSubscription();

  // ================================================
  // CREATE SUBSCRIPTION
  // ================================================

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe(
        {
          userVisibleOnly: true,

          applicationServerKey:
            urlBase64ToUint8Array(
              publicKey
            ),
        }
      );
  }

  console.log(
    "📱 Push subscription:",
    subscription
  );

  // ================================================
  // SEND TO BACKEND
  // ================================================

  const response =
    await fetch(
      `${API_URL}/api/notifications/push/subscribe`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          subscription:
            subscription.toJSON(),
        }),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to save push subscription."
    );
  }

  console.log(
    "✅ Push subscription saved on backend"
  );

  return subscription;
}

// =====================================================
// UNSUBSCRIBE
// =====================================================

export async function unsubscribeFromPush() {
  const token = getToken();

  if (!token) {
    return;
  }

  const registration =
    await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
  }

  await fetch(
    `${API_URL}/api/notifications/push/subscribe`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  console.log(
    "🔕 Push notifications disabled"
  );
}

// =====================================================
// CHECK STATUS
// =====================================================

export async function getPushStatus() {
  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return {
      supported: false,
      permission: "unsupported",
      subscribed: false,
    };
  }

  const registration =
    await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  return {
    supported: true,

    permission:
      Notification.permission,

    subscribed:
      Boolean(subscription),
  };
}