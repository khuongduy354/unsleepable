"use client";

import { useEffect, useState } from "react";
import { Post } from "@/lib/types/post.type";
import { postApi } from "@/lib/api";
import PostList from "../components/PostList";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrendingPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const trendingPosts = await postApi.getTrending(20); // Get top 20 trending posts
        setPosts(trendingPosts);
      } catch (err) {
        console.error("Error fetching trending posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load trending posts");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPosts();
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Card className="bg-linear-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-3xl">
                <Flame className="w-8 h-8 animate-pulse" />
                Trending Posts
                <TrendingUp className="w-8 h-8" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-lg">
                Discover the hottest posts based on engagement and recency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-4 mt-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Trending Posts</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Trending Posts Yet</h3>
                <p className="text-sm">Check back later for hot content!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts List */}
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-muted-foreground">
                Top {posts.length} Trending Posts
              </h2>
            </div>
            <PostList posts={posts} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
