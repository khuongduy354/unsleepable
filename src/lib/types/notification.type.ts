/**
 * Notification Types and Interfaces
 */

// Push subscription data structure
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Notification subscription with user info
export interface NotificationSubscription {
  id?: string;
  user_id: string;
  subscription: PushSubscription;
  created_at?: string;
}

// Notification payload
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

// Repository interface for notification subscriptions
export interface INotificationRepository {
  saveSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void>;
  getSubscription(userId: string): Promise<NotificationSubscription | null>;
  getAllSubscriptions(): Promise<NotificationSubscription[]>;
  deleteSubscription(userId: string): Promise<void>;
}

// Service interface for notification operations
export interface INotificationService {
  subscribe(userId: string, subscription: PushSubscription): Promise<void>;
  unsubscribe(userId: string): Promise<void>;
  sendToUser(userId: string, payload: NotificationPayload): Promise<void>;
  sendToAll(payload: NotificationPayload): Promise<void>;
  getVapidPublicKey(): string;
}
