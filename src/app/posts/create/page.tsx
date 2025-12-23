"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { postApi, communityApi } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";

interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Mock user ID for testing
  const [userId] = useState("d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234");

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoadingCommunities(true);
      const data = await communityApi.getAll(1, 100);
      setCommunities(data.communities || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load communities",
        variant: "destructive",
      });
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !communityId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newPost = await postApi.create({
        title: title.trim(),
        content: content.trim(),
        user_id: userId,
        community_id: communityId,
      });

      toast({
        title: "Success",
        description: "Post created successfully",
      });

      // Navigate to the new post
      router.push(`/posts/${newPost.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {/* Back Button */}
        <Button onClick={() => router.back()} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Create a Post</h1>
          <p className="text-muted-foreground mt-2">
            Share your thoughts with the community
          </p>
        </div>

        {/* Mock User ID Alert */}
        <Alert className="mb-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-950">
          <AlertDescription>
            <p className="text-sm font-semibold mb-1">Testing Mode</p>
            <p className="text-sm text-muted-foreground">
              Using mock user ID: {userId.substring(0, 20)}...
            </p>
          </AlertDescription>
        </Alert>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>
              Fill in the details to create your post
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Community Selection */}
              <div className="space-y-2">
                <Label htmlFor="community">Community *</Label>
                {loadingCommunities ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading communities...</span>
                  </div>
                ) : (
                  <Select value={communityId} onValueChange={setCommunityId}>
                    <SelectTrigger id="community">
                      <SelectValue placeholder="Select a community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {communities.length === 0 && !loadingCommunities && (
                  <p className="text-sm text-muted-foreground">
                    No communities available. Create one first.
                  </p>
                )}
              </div>

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
                <Textarea
                  id="content"
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={10}
                  className="resize-y"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {content.length} characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={
                    loading || !title.trim() || !content.trim() || !communityId
                  }
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Create Post
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
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
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {content}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
