"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { postApi } from "@/lib/api";
import type { Post as ApiPost } from "@/lib/types/post.type";

export default function PostsPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = !!localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loggedIn);

    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await postApi.getAll();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await postApi.delete(postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast({
        title: "Deleted",
        description: "Post has been deleted",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleInteraction = (action: () => void) => {
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please login to interact with posts",
        variant: "destructive",
      });
      return;
    }
    action();
  };

  return (
    <AppLayout>
      <Toaster />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Feed</h1>
          {isLoggedIn && (
            <Button
              onClick={() => router.push("/posts/create")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Post
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const timeAgo = new Date(post.created_at).toLocaleString();
              const currentUserId = localStorage.getItem("userId");
              const isOwnPost = currentUserId === post.user_id;

              return (
                <Card
                  key={post.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/posts/${post.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {post.user_id[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{post.user_id}</span>
                          {post.community_id && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                in
                              </span>
                              <span className="text-sm text-primary">
                                {post.community_id}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <h3 className="text-xl font-semibold">{post.title}</h3>
                    <p className="text-muted-foreground">{post.content}</p>
                  </CardContent>
                  <CardFooter className="flex gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction(() => {});
                      }}
                    >
                      <ThumbsUp className="w-4 h-4" />0
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction(() => {});
                      }}
                    >
                      <ThumbsDown className="w-4 h-4" />0
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/posts/${post.id}`);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Comments
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction(() => {});
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    {isLoggedIn && isOwnPost && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/posts/edit/${post.id}`);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive"
                          onClick={(e) => handleDeletePost(post.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
