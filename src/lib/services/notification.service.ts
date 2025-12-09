import webpush from "web-push";
import {
  INotificationRepository,
  INotificationService,
  NotificationPayload,
  PushSubscription,
} from "@/lib/types/notification.type";

/**
 * Notification Service
 * Handles business logic for push notifications
 */
export class NotificationService implements INotificationService {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;

  constructor(private repository: INotificationRepository) {
    // VAPID keys should be generated once and stored securely
    // For now, we'll use environment variables
    this.vapidPublicKey =
      process.env.VAPID_PUBLIC_KEY ||
      "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
    this.vapidPrivateKey =
      process.env.VAPID_PRIVATE_KEY || "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls";

    // Configure web-push with VAPID details
    webpush.setVapidDetails(
      "mailto:example@yourdomain.org",
      this.vapidPublicKey,
      this.vapidPrivateKey
    );
  }

  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  async subscribe(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    await this.repository.saveSubscription(userId, subscription);
  }

  async unsubscribe(userId: string): Promise<void> {
    await this.repository.deleteSubscription(userId);
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    const subscription = await this.repository.getSubscription(userId);
    if (!subscription) {
      throw new Error(`No subscription found for user: ${userId}`);
    }

    await this.sendNotification(subscription.subscription, payload);
  }

  async sendToAll(payload: NotificationPayload): Promise<void> {
    const subscriptions = await this.repository.getAllSubscriptions();
    
    console.log(`[NotificationService] Sending to ${subscriptions.length} subscribers`);
    console.log(`[NotificationService] Payload:`, payload);

    // Send notifications to all subscribers
    const promises = subscriptions.map((sub) =>
      this.sendNotification(sub.subscription, payload).catch((error) => {
        console.error(
          `Failed to send notification to user ${sub.user_id}:`,
          error
        );
        // Continue with other notifications even if one fails
      })
    );

    await Promise.allSettled(promises);
    console.log(`[NotificationService] Finished sending notifications`);
  }

  private async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    try {
      console.log(`[NotificationService] Sending to endpoint:`, subscription.endpoint);
      const result = await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );
      console.log(`[NotificationService] Send result:`, result.statusCode);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[NotificationService] Send error:`, error.message);
        // If subscription is expired or invalid, we might want to delete it
        if (error.message.includes("410")) {
          // HTTP 410 Gone - subscription expired
          console.error("Subscription expired, should be deleted");
        }
        throw error;
      }
      throw new Error("Failed to send notification");
    }
  }
}
