"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Calendar, User as UserIcon } from "lucide-react";
import { userApi } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  created_at: string;
  status: string;
}

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile by ID
        const data = await userApi.getUserById(userId);
        setProfile(data as UserProfile);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleMessageUser = () => {
    if (!currentUserId) {
      router.push("/auth/login");
      return;
    }
    
    if (profile) {
      router.push(`/chat/${profile.id}`);
    }
  };

  const isOwnProfile = currentUserId === userId;

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <p className="text-lg font-semibold mb-2">Error</p>
                <p>{error}</p>
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="mt-4"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="text-3xl">
                      {profile.username?.substring(0, 2).toUpperCase() || 
                       profile.email?.substring(0, 2).toUpperCase() || 
                       "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">
                      {profile.username || "Anonymous User"}
                    </h1>
                    
                    <div className="flex flex-col gap-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>User ID: {profile.id.substring(0, 8)}...</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Joined {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          profile.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="capitalize">{profile.status}</span>
                      </div>
                    </div>

                    {!isOwnProfile && currentUserId && (
                      <div className="mt-4">
                        <Button
                          onClick={handleMessageUser}
                          className="gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Send Message
                        </Button>
                      </div>
                    )}

                    {isOwnProfile && (
                      <div className="mt-4">
                        <Button
                          onClick={() => router.push("/profile/edit")}
                          variant="outline"
                        >
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Username
                    </p>
                    <p className="text-lg">{profile.username || "Not set"}</p>
                  </div>
                  
                  {isOwnProfile && profile.email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Email
                      </p>
                      <p className="text-lg">{profile.email}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Account Status
                    </p>
                    <p className="text-lg capitalize">{profile.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
