"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { postApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import AssetAutocomplete from "@/components/ui/asset-autocomplete";
import { Post } from "@/lib/types/post.type";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get user ID from localStorage
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setFetching(true);
      const fetchedPost = await postApi.getById(postId);
      setPost(fetchedPost);
      setTitle(fetchedPost.title);
      setContent(fetchedPost.content);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      });
      router.push("/posts");
    } finally {
      setFetching(false);
    }
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          try {
            const imageUrl = await uploadImage(file);
            const imageMarkdown = `\n![Image](${imageUrl})\n`;
            setContent((prev) => prev + imageMarkdown);

            toast({
              title: "Success",
              description: "Image uploaded successfully",
            });
          } catch (error) {
            // Error already handled in uploadImage
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authorization
    if (!userId || userId !== post?.user_id) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own posts",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await postApi.update(postId, {
        title: title.trim(),
        content: content.trim(),
      });

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      router.push(`/posts/${postId}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Post Not Found</CardTitle>
              <CardDescription>
                The post you're looking for doesn't exist
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Check if user is authorized to edit
  if (userId !== post.user_id) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Unauthorized</CardTitle>
              <CardDescription>
                You can only edit your own posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/posts/${postId}`)}>
                View Post
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {/* Back Button */}
        <Button
          onClick={() => router.push(`/posts/${postId}`)}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Edit Post</h1>
          <p className="text-muted-foreground mt-2">Update your post content</p>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>Make changes to your post content</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Give your post a catchy title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {title.length}/200
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <AssetAutocomplete
                  value={content}
                  onChange={setContent}
                  onPaste={handlePaste}
                  placeholder="What's on your mind? Type @ to reference files, paste images with Ctrl+V"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading image...
                  </p>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  {content.length} characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/posts/${postId}`)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {(title.trim() || content.trim()) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {title.trim() && (
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
              )}
              {content.trim() && (
                <div className="prose prose-sm max-w-none">
                  {content.split("\n").map((line, idx) => {
                    // Check if line is a markdown image
                    const imageMatch = line.match(/!\[.*?\]\((.*?)\)/);
                    if (imageMatch) {
                      return (
                        <img
                          key={idx}
                          src={imageMatch[1]}
                          alt="Uploaded image"
                          className="max-w-full h-auto rounded-lg my-2"
                        />
                      );
                    }
                    // Regular text
                    return line ? (
                      <p key={idx} className="text-muted-foreground mb-2">
                        {line}
                      </p>
                    ) : (
                      <br key={idx} />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
