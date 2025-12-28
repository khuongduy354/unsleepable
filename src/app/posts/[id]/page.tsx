"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { postApi, commentApi, reportApi } from "@/lib/api";
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
  Flag,
  Reply,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

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
  author_email?: string;
  author_name?: string;
  community_name?: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string | null;
  author_email?: string;
  author_name?: string;
  replies?: Comment[];
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const { toast } = useToast();
  const { userId } = useUser();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [reportingComment, setReportingComment] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
    {}
  );
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});

  // Helper function to render content with markdown images
  const renderContent = (content: string) => {
    const parts = [];
    let lastIndex = 0;
    // Regex to match markdown image syntax: ![alt text](image_url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add the image
      const altText = match[1];
      const imageUrl = match[2];
      parts.push(
        <img
          key={`img-${match.index}`}
          src={imageUrl}
          alt={altText}
          className="max-w-full h-auto rounded-lg my-4"
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last image
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

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
      // Filter to get only top-level comments (no parent)
      const topLevelComments = (data.comments || []).filter(
        (comment: Comment) => !comment.parent_comment_id
      );
      setComments(topLevelComments);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const loadReplies = async (commentId: string) => {
    if (showReplies[commentId]) {
      // Toggle off
      setShowReplies({ ...showReplies, [commentId]: false });
      return;
    }

    setLoadingReplies({ ...loadingReplies, [commentId]: true });
    try {
      const replies = await commentApi.getReplies(commentId);

      // Update the comment with its replies
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId ? { ...comment, replies } : comment
        )
      );

      setShowReplies({ ...showReplies, [commentId]: true });
    } catch (error) {
      console.error("Failed to load replies:", error);
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      });
    } finally {
      setLoadingReplies({ ...loadingReplies, [commentId]: false });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to comment",
        variant: "destructive",
      });
      return;
    }

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
  };

  const handleDelete = async () => {
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
      await postApi.update(postId, { summary });

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

  const handleReportComment = async (commentId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to report comments",
        variant: "destructive",
      });
      return;
    }

    if (!reportReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    try {
      await reportApi.create(
        {
          reportedEntityId: commentId,
          reportedEntityType: "comment",
          reason: reportReason,
        },
        userId
      );

      toast({
        title: "Success",
        description: "Comment reported successfully",
      });
      setReportingComment(null);
      setReportReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report comment",
        variant: "destructive",
      });
    }
  };

  const handleReplyToComment = async (parentCommentId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to reply to comments",
        variant: "destructive",
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      });
      return;
    }

    setSubmittingComment(true);
    try {
      await commentApi.create({
        content: replyContent,
        user_id: userId,
        post_id: postId,
        parent_comment_id: parentCommentId,
      });

      toast({
        title: "Success",
        description: "Reply posted successfully",
      });
      setReplyContent("");
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
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
                  By{" "}
                  {post.author_name ||
                    post.author_email?.split("@")[0] ||
                    `User ${post.user_id.substring(0, 8)}`}
                  {post.community_name && (
                    <>
                      {" "}
                      in{" "}
                      <span className="font-medium text-blue-600">
                        {post.community_name}
                      </span>
                    </>
                  )}
                  {" • Posted "}
                  {new Date(post.created_at).toLocaleDateString()} at{" "}
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
            <div className="text-base whitespace-pre-wrap mb-6">
              {renderContent(
                showSummary && post.summary ? post.summary : post.content
              )}
            </div>

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
                        <AvatarFallback>
                          {(
                            comment.author_name ||
                            comment.author_email ||
                            comment.user_id
                          )
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {comment.author_name ||
                              comment.author_email?.split("@")[0] ||
                              `User ${comment.user_id.substring(0, 8)}`}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{comment.content}</p>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReplyingTo(
                                replyingTo === comment.id ? null : comment.id
                              )
                            }
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReportingComment(
                                reportingComment === comment.id
                                  ? null
                                  : comment.id
                              )
                            }
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            Report
                          </Button>
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Write your reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReplyToComment(comment.id)}
                                disabled={
                                  submittingComment || !replyContent.trim()
                                }
                              >
                                {submittingComment && (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                )}
                                Post Reply
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Report Form */}
                        {reportingComment === comment.id && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Why are you reporting this comment? (required)"
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReportComment(comment.id)}
                                disabled={!reportReason.trim()}
                              >
                                <Flag className="mr-2 h-3 w-3" />
                                Submit Report
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setReportingComment(null);
                                  setReportReason("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Load Replies Button */}
                        <div className="mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadReplies(comment.id)}
                            disabled={loadingReplies[comment.id]}
                          >
                            {loadingReplies[comment.id] ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Loading replies...
                              </>
                            ) : showReplies[comment.id] ? (
                              <>Hide replies</>
                            ) : (
                              <>View replies</>
                            )}
                          </Button>
                        </div>

                        {/* Replies Section */}
                        {showReplies[comment.id] && comment.replies && (
                          <div className="mt-4 ml-8 space-y-3 border-l-2 border-gray-200 pl-4">
                            {comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="flex items-start gap-3"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {(
                                      reply.author_name ||
                                      reply.author_email ||
                                      reply.user_id
                                    )
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">
                                      {reply.author_name ||
                                        reply.author_email?.split("@")[0] ||
                                        `User ${reply.user_id.substring(0, 8)}`}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(
                                        reply.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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
