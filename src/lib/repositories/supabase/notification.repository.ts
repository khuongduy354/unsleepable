import { SupabaseClient } from "@supabase/supabase-js";
import {
  INotificationRepository,
  NotificationSubscription,
  PushSubscription,
} from "@/lib/types/notification.type";

/**
 * Supabase implementation of notification repository
 * Handles storage and retrieval of push notification subscriptions
 */
export class SupabaseNotificationRepository
  implements INotificationRepository
{
  constructor(private supabase: SupabaseClient) {}

  async saveSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    const { error } = await this.supabase
      .from("notification_subscriptions")
      .upsert({
        user_id: userId,
        subscription: subscription,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
  }

  async getSubscription(
    userId: string
  ): Promise<NotificationSubscription | null> {
    const { data, error } = await this.supabase
      .from("notification_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get subscription: ${error.message}`);
    }

    return data as NotificationSubscription;
  }

  async getAllSubscriptions(): Promise<NotificationSubscription[]> {
    const { data, error } = await this.supabase
      .from("notification_subscriptions")
      .select("*");

    if (error) {
      throw new Error(`Failed to get all subscriptions: ${error.message}`);
    }

    return (data as NotificationSubscription[]) || [];
  }

  async deleteSubscription(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notification_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }
}
