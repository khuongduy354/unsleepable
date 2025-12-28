"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellOff,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Mail,
  Loader2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationApi } from "@/lib/api";

interface Notification {
  id: string;
  type: "like" | "dislike" | "comment" | "message";
  title: string;
  body: string;
  created_at: string;
  data?: any;
}

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

export default function NotificationsPage() {
  // Temporary in-memory notifications (lost on refresh)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const { toast } = useToast();

  // Add a notification to the list
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  useEffect(() => {
    // Check if push notifications are supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsPushSupported(true);
      checkSubscription();

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "PUSH_NOTIFICATION") {
          const { title, body, data } = event.data.payload;
          addNotification({
            id: `notif-${Date.now()}`,
            type: data?.type || "message",
            title,
            body,
            created_at: new Date().toISOString(),
            data,
          });
        }
      });
    }
  }, [addNotification]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleEnablePush = async () => {
    try {
      setLoading(true);

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await registration.update();

      // Get VAPID key
      const { publicKey } = await notificationApi.getVapidKey();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      try {
        await notificationApi.subscribe(subscription);
      } catch (serverError) {
        // Rollback browser subscription if server fails
        await subscription.unsubscribe();
        throw serverError;
      }

      // Check subscription again to confirm
      await checkSubscription();

      toast({
        title: "Success",
        description: "Push notifications enabled successfully",
      });
    } catch (error) {
      console.error("Error enabling push:", error);
      // Ensure UI reflects actual state
      await checkSubscription();
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to enable push notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        // Notify server to remove subscription
        try {
          await notificationApi.unsubscribe();
        } catch (err) {
          console.error("Failed to notify server:", err);
        }
      }

      // Check subscription again to confirm
      await checkSubscription();

      toast({
        title: "Success",
        description: "Push notifications disabled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to disable notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <ThumbsUp className="h-5 w-5 text-blue-500" />;
      case "dislike":
        return <ThumbsDown className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "message":
        return <Mail className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-10 w-10" />
            Notifications
            {notifications.length > 0 && (
              <Badge variant="secondary" className="text-lg">
                {notifications.length}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time notifications (temporary, clears on refresh)
          </p>
        </div>

        {/* Push Settings */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Push Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {isPushSupported ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Get notified about likes, comments, and messages
                  </p>
                  {isSubscribed && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Push notifications enabled
                    </p>
                  )}
                </div>
                <Button
                  onClick={isSubscribed ? handleDisablePush : handleEnablePush}
                  variant={isSubscribed ? "destructive" : "default"}
                  disabled={loading}
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <BellOff className="mr-2 h-4 w-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-yellow-600">
                Push notifications are not supported in your browser
              </p>
            )}
          </CardContent>
        </Card>

        {/* Clear All Button */}
        {notifications.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={clearNotifications}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Notifications will appear here when you receive likes,
                  comments, or messages
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium">
                          {notification.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <CardDescription className="mt-0.5 text-sm">
                        {notification.body}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
