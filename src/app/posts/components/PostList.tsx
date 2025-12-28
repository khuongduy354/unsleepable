"use client";

import { Post } from "@/lib/types/post.type";
import { useRouter } from "next/navigation";
import { postApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { userId } = useUser();

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to delete posts",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await postApi.delete(postId, userId);
      window.location.reload(); // Simple reload to refresh the list
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
    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to like posts",
        variant: "destructive",
      });
      return;
    }
    try {
      await postApi.react(postId, userId, "like");
      window.location.reload();
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
    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to dislike posts",
        variant: "destructive",
      });
      return;
    }
    try {
      await postApi.react(postId, userId, "dislike");
      window.location.reload();
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
                    {(post.author_name || post.author_email || post.user_id)
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {post.author_name ||
                        post.author_email?.split("@")[0] ||
                        `User ${post.user_id.substring(0, 8)}`}
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
                <span>{post.likes_count || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDislike(post.id, e)}
                className="gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{post.dislikes_count || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/posts/${post.id}`)}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{post.comments_count || 0}</span>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
