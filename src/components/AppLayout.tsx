"use client";

import { ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  PlusSquare,
  Users,
  LogOut,
  MessageSquare,
  TrendingUp,
  Bell,
  Mail,
  HardDrive,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/contexts/UserContext";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { isLoggedIn, username, refreshUser } = useUser();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    setShowLogoutDialog(false);
    await refreshUser();
    router.push("/auth/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card text-card-foreground flex flex-col border-r">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Unsleepable</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={
              isActive("/") || isActive("/posts") ? "secondary" : "ghost"
            }
            className="w-full justify-start gap-3"
            onClick={() => router.push("/posts")}
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          <Button
            variant={isActive("/communities") ? "secondary" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => router.push("/communities")}
          >
            <Users className="w-4 h-4" />
            Communities
          </Button>
          {isLoggedIn && (
            <>
              <Button
                variant={isActive("/posts/create") ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => router.push("/posts/create")}
              >
                <PlusSquare className="w-4 h-4" />
                Create Post
              </Button>
              <Button
                variant={isActive("/chat") ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => router.push("/chat")}
              >
                <Mail className="w-4 h-4" />
                Messages
              </Button>
              <Button
                variant={isActive("/notifications") ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => router.push("/notifications")}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
              <Button
                variant={isActive("/storage") ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => router.push("/storage")}
              >
                <HardDrive className="w-4 h-4" />
                Storage
              </Button>
            </>
          )}
        </nav>

        <div className="p-4 border-t space-y-2">
          {isLoggedIn ? (
            <>
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-semibold text-foreground">
                  {username}
                </span>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              className="w-full"
              onClick={() => router.push("/auth/login")}
            >
              Login
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to login again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
