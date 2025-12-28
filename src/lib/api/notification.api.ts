// API callers for notification endpoints

export interface Notification {
  id: string;
  type: "like" | "comment" | "message";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export const notificationApi = {
  // Subscribe to push notifications
  async subscribe(subscription: PushSubscription) {
    const response = await fetch("/api/notification/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription }),
    });

    if (!response.ok) {
      throw new Error("Failed to subscribe to notifications");
    }

    return await response.json();
  },

  // Unsubscribe from push notifications
  async unsubscribe() {
    const response = await fetch("/api/notification/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to unsubscribe from notifications");
    }

    return await response.json();
  },

  // Get VAPID public key
  async getVapidKey() {
    const response = await fetch("/api/notification/vapid");

    if (!response.ok) {
      throw new Error("Failed to get VAPID key");
    }

    return await response.json();
  },

  // Send notification to all users
  async sendToAll(data: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }) {
    const response = await fetch("/api/notification/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to send notification");
    }

    return await response.json();
  },
};
