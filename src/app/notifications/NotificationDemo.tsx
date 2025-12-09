"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationDemo() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      // Unregister any existing service workers first to ensure clean state
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of existingRegistrations) {
        await reg.unregister();
        console.log("[Client] Unregistered old service worker");
      }

      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none", // Don't cache the service worker
      });
      console.log("[Client] Service worker registered:", reg);
      
      // Force update
      await reg.update();
      console.log("[Client] Service worker updated");
      
      setRegistration(reg);
      
      // Wait for service worker to be ready
      const readyReg = await navigator.serviceWorker.ready;
      console.log("[Client] Service worker ready, state:", readyReg.active?.state);
      
      // Check if already subscribed
      const subscription = await reg.pushManager.getSubscription();
      console.log("[Client] Existing subscription:", subscription);
      setIsSubscribed(!!subscription);
      
      if (subscription) {
        setMessage("Service worker active and subscribed ✓");
      } else {
        setMessage("Service worker active. Click 'Enable Notifications' to subscribe.");
      }
    } catch (error) {
      console.error("[Client] Service worker registration failed:", error);
      setMessage(`SW registration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function subscribeToPush() {
    if (!registration) {
      setMessage("Service worker not registered");
      return;
    }

    try {
      // Check notification permission
      const permission = await Notification.requestPermission();
      console.log("[Client] Notification permission:", permission);
      
      if (permission !== "granted") {
        setMessage("Notification permission denied. Please enable in browser settings.");
        return;
      }

      // Get VAPID public key from server
      const response = await fetch("/api/notification/vapid");
      const { publicKey } = await response.json();
      console.log("[Client] VAPID public key received");

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.log("[Client] Browser subscription created:", subscription);

      // Send subscription to server
      const subscribeResponse = await fetch("/api/notification/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      });

      if (subscribeResponse.ok) {
        setIsSubscribed(true);
        setMessage("Successfully subscribed to notifications! ✓");
        console.log("[Client] Subscription saved to server");
      } else {
        const errorText = await subscribeResponse.text();
        console.error("[Client] Failed to subscribe on server:", errorText);
        setMessage(`Failed to subscribe: ${errorText}`);
      }
    } catch (error) {
      console.error("[Client] Error subscribing to push:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function unsubscribeFromPush() {
    if (!registration) {
      return;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from server
      await fetch("/api/notification/subscribe", {
        method: "DELETE",
      });

      setIsSubscribed(false);
      setMessage("Unsubscribed from notifications");
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setMessage("Error unsubscribing from notifications");
    }
  }

  async function sendTestNotification() {
    try {
      console.log("[Client] Sending test notification...");
      const response = await fetch("/api/notification/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Notification",
          body: "This is a test notification sent to all users!",
          icon: "/icon.png",
          data: { url: "/" },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("[Client] Notification sent:", result);
        setMessage("Test notification sent to all users! Check your notifications.");
      } else {
        const errorText = await response.text();
        console.error("[Client] Failed to send:", errorText);
        setMessage(`Failed to send test notification: ${errorText}`);
      }
    } catch (error) {
      console.error("[Client] Error sending notification:", error);
      setMessage(`Error sending notification: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function testLocalNotification() {
    try {
      if (!registration) {
        setMessage("Service worker not ready");
        return;
      }

      console.log("[Client] Showing local notification via service worker...");
      await registration.showNotification("Local Test Notification", {
        body: "This is a direct notification from the service worker (not via push)",
        icon: "/icon.png",
        badge: "/badge.png",
        tag: "test-" + Date.now(),
      });
      setMessage("Local notification shown! If you see it, service worker is working correctly.");
    } catch (error) {
      console.error("[Client] Error showing local notification:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 rounded">
        <p className="text-red-700">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Push Notifications Demo</h1>

      <div className="space-y-4">
        <div className="p-4 bg-blue-100 border border-blue-400 rounded">
          <p className="text-blue-700">
            Status: {isSubscribed ? "Subscribed ✓" : "Not subscribed"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            {!isSubscribed ? (
              <button
                onClick={subscribeToPush}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Enable Notifications
              </button>
            ) : (
              <>
                <button
                  onClick={unsubscribeFromPush}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Disable Notifications
                </button>
                <button
                  onClick={sendTestNotification}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send Test to All Users (via Push)
                </button>
              </>
            )}
          </div>
          
          {registration && (
            <button
              onClick={testLocalNotification}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 w-fit"
            >
              Test Local Notification (Debug)
            </button>
          )}
        </div>

        {message && (
          <div className="p-4 bg-gray-100 border border-gray-400 rounded">
            <p>{message}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-400 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Enable Notifications" to subscribe</li>
            <li>Grant notification permission when prompted</li>
            <li>Click "Send Test to All Users" to send a notification</li>
            <li>You should receive the notification (even if the tab is in background)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
