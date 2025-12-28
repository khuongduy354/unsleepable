"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  userId: string | null;
  username: string | null;
  email: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        // Store in localStorage for backwards compatibility
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", session.user.id);
        localStorage.setItem(
          "username",
          session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User"
        );
      } else {
        setUser(null);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Subscribe to auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", session.user.id);
        localStorage.setItem(
          "username",
          session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User"
        );
      } else {
        setUser(null);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: UserContextType = {
    user,
    userId: user?.id || null,
    username:
      user?.user_metadata?.full_name || user?.email?.split("@")[0] || null,
    email: user?.email || null,
    isLoggedIn: !!user,
    loading,
    refreshUser: fetchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
