"use client";

import { useState, useEffect } from "react";
import { communityApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Users, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";

interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
}

interface PaginatedResponse {
  communities: Community[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [ownedCommunities, setOwnedCommunities] = useState<Community[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(
    null
  );
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public" as "public" | "private",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get userId from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch all communities
  const fetchCommunities = async (page: number = 1) => {
    try {
      const data = await communityApi.getAll(page, 5);
      setCommunities(data.communities);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch communities"
      );
    }
  };

  // Fetch owned communities
  const fetchOwnedCommunities = async () => {
    if (!userId) return;

    try {
      const data = await communityApi.getOwned(userId);
      setOwnedCommunities(data.communities);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch owned communities"
      );
    }
  };

  useEffect(() => {
    fetchCommunities(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (userId) {
      fetchOwnedCommunities();
    }
  }, [userId]);

  // Create community
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      await communityApi.create(userId, formData);

      toast({
        title: "Success",
        description: "Community created successfully",
      });

      // Reset form and refresh data
      setFormData({ name: "", description: "", visibility: "public" });
      setShowCreateForm(false);
      await fetchCommunities(currentPage);
      await fetchOwnedCommunities();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create community";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update community
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommunity || !userId) return;

    setLoading(true);
    setError("");

    try {
      await communityApi.update(editingCommunity.id, userId, formData);

      toast({
        title: "Success",
        description: "Community updated successfully",
      });

      // Reset form and refresh data
      setFormData({ name: "", description: "", visibility: "public" });
      setEditingCommunity(null);
      await fetchCommunities(currentPage);
      await fetchOwnedCommunities();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update community";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete community
  const handleDelete = async (communityId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID first",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this community?")) return;

    setLoading(true);
    setError("");

    try {
      await communityApi.delete(communityId, userId);

      toast({
        title: "Success",
        description: "Community deleted successfully",
      });

      await fetchCommunities(currentPage);
      await fetchOwnedCommunities();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete community";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (community: Community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      description: community.description || "",
      visibility: community.visibility as "public" | "private",
    });
    setShowCreateForm(false);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground mt-2">
            Discover and join communities
          </p>
        </div>

        {/* User ID Display (if not logged in properly) */}
        {!userId && (
          <Alert className="mb-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-950">
            <AlertDescription>
              <p className="text-sm font-semibold mb-1">Not Authenticated</p>
              <p className="text-sm text-muted-foreground">
                Please log in to create or manage communities.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingCommunity) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingCommunity ? "Edit Community" : "Create Community"}
              </CardTitle>
              <CardDescription>
                {editingCommunity
                  ? "Update your community details"
                  : "Start a new community"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={editingCommunity ? handleUpdate : handleCreate}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Enter community name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your community"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        visibility: value as "public" | "private",
                      })
                    }
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>Public</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>Private</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {loading
                      ? "Saving..."
                      : editingCommunity
                      ? "Update"
                      : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCommunity(null);
                      setFormData({
                        name: "",
                        description: "",
                        visibility: "public",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Create Button */}
        {!showCreateForm && !editingCommunity && (
          <Button onClick={() => setShowCreateForm(true)} className="mb-6">
            <Plus className="mr-2 h-4 w-4" />
            Create Community
          </Button>
        )}

        {/* Owned Communities */}
        {userId && ownedCommunities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Communities</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {ownedCommunities.map((community) => (
                <Card
                  key={community.id}
                  className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {community.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              community.visibility === "public"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {community.visibility === "public" ? (
                              <>
                                <Globe className="h-3 w-3 mr-1" /> Public
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" /> Private
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              community.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(community)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(community.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {community.description || "No description provided"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Communities */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Communities</h2>
          {communities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No communities found.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create the first community
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {communities.map((community) => (
                  <Card
                    key={community.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {community.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            community.visibility === "public"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {community.visibility === "public" ? (
                            <>
                              <Globe className="h-3 w-3 mr-1" /> Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" /> Private
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(community.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {community.description || "No description provided"}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Community
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
