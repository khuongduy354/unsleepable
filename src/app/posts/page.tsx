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
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { postApi } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  community_id: string;
  created_at: string;
  updated_at: string | null;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  engagement_score: number | null;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Mock user ID for testing
  const [userId] = useState("d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234");

  useEffect(() => {
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

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await postApi.delete(postId, userId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast({
        title: "Success",
        description: "Post deleted successfully",
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

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await postApi.react(postId, userId, "like");
      await fetchPosts();
      toast({
        title: "Success",
        description: "Post liked",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    }
  };

  const handleDislike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await postApi.react(postId, userId, "dislike");
      await fetchPosts();
      toast({
        title: "Success",
        description: "Post disliked",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dislike post",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold tracking-tight">Feed</h1>
          <Button
            onClick={() => router.push("/posts/create")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No posts yet. Be the first to create one!
              </p>
              <Button
                onClick={() => router.push("/posts/create")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const timeAgo = new Date(post.created_at).toLocaleString();
              const isOwnPost = userId === post.user_id;

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
                          {post.user_id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            User {post.user_id.substring(0, 8)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo}
                        </span>
                      </div>
                      {isOwnPost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeletePost(post.id, e)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                    <p className="text-muted-foreground line-clamp-3">
                      {post.content}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleLike(post.id, e)}
                      className="gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.likes_count}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDislike(post.id, e)}
                      className="gap-2"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{post.dislikes_count}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/posts/${post.id}`)}
                      className="gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </Button>
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
