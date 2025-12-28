"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellOff,
  MessageSquare,
  ThumbsUp,
  Mail,
  Loader2,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationApi } from "@/lib/api";

interface Notification {
  id: string;
  type: "like" | "comment" | "message";
  title: string;
  message: string;
  read: boolean;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsPushSupported(true);
      checkSubscription();
    }

    // Load real notifications
    loadNotifications();
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");

      if (!userId) {
        console.log("No user ID found");
        setNotifications([]);
        return;
      }

      const response = await fetch("/api/notifications", {
        headers: {
          "x-user-id": userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error("Failed to load notifications");
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
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
      await notificationApi.subscribe(subscription);

      // Check subscription again to confirm
      await checkSubscription();

      toast({
        title: "Success",
        description: "Push notifications enabled successfully",
      });
    } catch (error) {
      console.error("Error enabling push:", error);
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

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <ThumbsUp className="h-5 w-5 text-blue-500" />;
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

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-10 w-10" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-lg">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with your latest activity
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !notification.read ? "border-blue-200 bg-blue-50/50" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">
                            {notification.title}
                          </CardTitle>
                          {!notification.read && (
                            <Badge variant="default" className="ml-2">
                              New
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {notification.message}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {notifications.filter((n) => !n.read).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No unread notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications
                .filter((n) => !n.read)
                .map((notification) => (
                  <Card
                    key={notification.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 bg-blue-50/50"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">
                              {notification.title}
                            </CardTitle>
                            <Badge variant="default" className="ml-2">
                              New
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">
                            {notification.message}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPushSupported ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Push Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          Get notified about new likes, comments, and messages
                        </p>
                      </div>
                      <Button
                        onClick={
                          isSubscribed ? handleDisablePush : handleEnablePush
                        }
                        variant={isSubscribed ? "destructive" : "default"}
                        disabled={loading}
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
                    {isSubscribed && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Push notifications are enabled
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Push notifications are not supported in your browser
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
