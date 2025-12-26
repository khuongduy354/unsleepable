"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { postApi, commentApi } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Edit,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  summary?: string | null;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Mock user ID for testing
  const [userId] = useState("d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234");

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const data = await postApi.getById(postId);
      setPost(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await commentApi.getByPost(postId);
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      await commentApi.create({
        content: commentContent,
        user_id: userId,
        post_id: postId,
      });

      toast({
        title: "Success",
        description: "Comment added successfully",
      });

      setCommentContent("");
      await fetchComments();
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    try {
      await postApi.react(postId, userId, "like");
      await fetchPost();
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

  const handleDislike = async () => {
    try {
      await postApi.react(postId, userId, "dislike");
      await fetchPost();
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
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await postApi.delete(postId, userId);
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      router.push("/posts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleSummarize = async () => {
    if (!post) return;

    setSummarizing(true);
    try {
      const response = await fetch("/api/aisummarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: post.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to summarize");
      }

      const { summary } = await response.json();

      // Update post with summary
      await postApi.update(postId, userId, { summary });

      setPost({ ...post, summary });
      setShowSummary(true);

      toast({
        title: "Success",
        description: "Post summarized successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to summarize post",
        variant: "destructive",
      });
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Post not found</p>
              <Button
                onClick={() => router.push("/posts")}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Posts
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back Button */}
        <Button onClick={() => router.back()} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Post Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{post.title}</CardTitle>
                <CardDescription>
                  Posted {new Date(post.created_at).toLocaleDateString()} at{" "}
                  {new Date(post.created_at).toLocaleTimeString()}
                </CardDescription>
              </div>
              {post.user_id === userId && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Toggle - shown to everyone if summary exists */}
            {post.summary && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSummary(!showSummary)}
                >
                  {showSummary ? "Show Full Content" : "Show Summary"}
                </Button>
              </div>
            )}

            {/* Display content or summary */}
            <p className="text-base whitespace-pre-wrap mb-6">
              {showSummary && post.summary ? post.summary : post.content}
            </p>

            {/* Summarize button - only for post owner and if not summarized */}
            {post.user_id === userId && !post.summary && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSummarize}
                disabled={summarizing}
                className="mb-4"
              >
                {summarizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Summarize
                  </>
                )}
              </Button>
            )}

            <Separator className="my-4" />

            {/* Post Stats & Actions */}
            <div className="flex items-center gap-4 flex-wrap">
              <Button variant="ghost" size="sm" onClick={handleLike}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                {post.likes_count}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDislike}>
                <ThumbsDown className="mr-2 h-4 w-4" />
                {post.dislikes_count}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" />
                {post.comments_count} comments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Comment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add a Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder="Write your comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
              />
              <Button
                type="submit"
                disabled={submittingComment || !commentContent.trim()}
              >
                {submittingComment && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Post Comment
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Comments ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            User {comment.user_id.substring(0, 8)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
