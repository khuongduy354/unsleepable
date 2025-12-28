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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Users,
  Lock,
  Globe,
  BarChart3,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";

interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
  member_count?: number;
}

interface CommunityStats {
  communityId: string;
  totalPosts: number;
  totalMembers: number;
  activeEngagementRate: number;
}

interface PendingPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  community_id: string;
  created_at: string;
  author_name?: string;
}

interface Report {
  id: string;
  reported_entity_id: string;
  reported_entity_type: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
}

interface PendingMember {
  user_id: string;
  username?: string;
  email?: string;
  requested_at: string;
  community_id: string;
  community_name: string;
}

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState("joined");
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [ownedCommunities, setOwnedCommunities] = useState<Community[]>([]);
  const [discoverCommunities, setDiscoverCommunities] = useState<Community[]>(
    []
  );
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
  const [statsLoading, setStatsLoading] = useState<string | null>(null);
  const [communityStats, setCommunityStats] = useState<
    Record<string, CommunityStats>
  >({});

  // Admin panel states
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Get userId from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch joined communities (where user is member)
  const fetchJoinedCommunities = async () => {
    if (!userId) return;
    try {
      const data = await communityApi.getMemberCommunities(1, 100);
      setJoinedCommunities(data.communities);
    } catch (err) {
      console.error("Failed to fetch joined communities:", err);
    }
  };

  // Fetch owned communities
  const fetchOwnedCommunities = async () => {
    if (!userId) return;
    try {
      const data = await communityApi.getOwned(userId);
      setOwnedCommunities(data.communities);
    } catch (err) {
      console.error("Failed to fetch owned communities:", err);
    }
  };

  // Fetch discover communities (public communities)
  const fetchDiscoverCommunities = async (page: number = 1) => {
    try {
      const data = await communityApi.getAll(page, 10);
      setDiscoverCommunities(data.communities);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch communities"
      );
    }
  };

  // Fetch community statistics
  const fetchStatistics = async (communityId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to view statistics",
        variant: "destructive",
      });
      return;
    }

    setStatsLoading(communityId);
    try {
      const data = await communityApi.getStatistics(communityId, userId);
      setCommunityStats((prev) => ({
        ...prev,
        [communityId]: data.statistics,
      }));
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to fetch statistics",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(null);
    }
  };

  // Fetch pending posts for admin
  const fetchPendingPosts = async () => {
    if (!userId) return;
    setLoadingPending(true);
    try {
      const data = await communityApi.getPendingPosts(userId);
      setPendingPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch pending posts:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch pending reports for admin
  const fetchPendingReports = async () => {
    if (!userId) return;
    setLoadingPending(true);
    try {
      const data = await communityApi.getPendingReports(userId);
      setPendingReports(data.reports || []);
    } catch (err) {
      console.error("Failed to fetch pending reports:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch pending member requests for all owned communities
  const fetchPendingMembers = async () => {
    if (!userId || ownedCommunities.length === 0) return;
    setLoadingPending(true);
    try {
      const allPendingMembers: PendingMember[] = [];
      for (const community of ownedCommunities) {
        try {
          const data = await communityApi.getPendingMembers(
            community.id,
            userId
          );
          const membersWithCommunity = (data.pendingMembers || []).map(
            (member: any) => ({
              ...member,
              community_id: community.id,
              community_name: community.name,
            })
          );
          allPendingMembers.push(...membersWithCommunity);
        } catch (err) {
          console.error(
            `Failed to fetch pending members for ${community.name}:`,
            err
          );
        }
      }
      setPendingMembers(allPendingMembers);
    } catch (err) {
      console.error("Failed to fetch pending members:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Approve member request
  const handleApproveMember = async (communityId: string, memberId: string) => {
    if (!userId) return;
    try {
      await communityApi.approveMember(communityId, memberId, userId);
      toast({
        title: "Success",
        description: "Member approved successfully",
      });
      await fetchPendingMembers();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to approve member",
        variant: "destructive",
      });
    }
  };

  // Reject member request
  const handleRejectMember = async (communityId: string, memberId: string) => {
    if (!userId) return;
    try {
      await communityApi.rejectMember(communityId, memberId, userId);
      toast({
        title: "Success",
        description: "Member request rejected",
      });
      await fetchPendingMembers();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to reject member",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (userId) {
      fetchJoinedCommunities();
      fetchOwnedCommunities();
    }
    fetchDiscoverCommunities(currentPage);
  }, [userId, currentPage]);

  // Join community (sends request for approval)
  const handleJoin = async (communityId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please login to join communities",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await communityApi.join(communityId, userId);
      toast({
        title: result.status === "pending" ? "Request Sent" : "Success",
        description:
          result.message ||
          "Join request submitted. Waiting for admin approval.",
      });
      await fetchJoinedCommunities();
      await fetchDiscoverCommunities(currentPage);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to join community",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Leave community
  const handleLeave = async (communityId: string) => {
    if (!userId) return;

    if (!confirm("Are you sure you want to leave this community?")) return;

    setLoading(true);
    try {
      await communityApi.leave(communityId, userId);
      toast({
        title: "Success",
        description: "Successfully left the community",
      });
      await fetchJoinedCommunities();
      await fetchDiscoverCommunities(currentPage);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to leave community",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve post
  const handleApprovePost = async (postId: string) => {
    if (!userId) return;
    try {
      await communityApi.approvePost(postId, userId);
      toast({
        title: "Success",
        description: "Post approved successfully",
      });
      await fetchPendingPosts();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to approve post",
        variant: "destructive",
      });
    }
  };

  // Reject post
  const handleRejectPost = async (postId: string) => {
    if (!userId) return;
    try {
      await communityApi.rejectPost(postId, userId);
      toast({
        title: "Success",
        description: "Post rejected successfully",
      });
      await fetchPendingPosts();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to reject post",
        variant: "destructive",
      });
    }
  };

  // Handle report decision
  const handleReportDecision = async (
    reportId: string,
    decision: "APPROVE" | "REJECT"
  ) => {
    if (!userId) return;
    try {
      await communityApi.decideReport(reportId, userId, decision);
      toast({
        title: "Success",
        description: `Report ${decision.toLowerCase()}d successfully`,
      });
      await fetchPendingReports();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to handle report",
        variant: "destructive",
      });
    }
  };

  // Create community
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "Error",
        description: "Please login first",
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
      setFormData({ name: "", description: "", visibility: "public" });
      setShowCreateForm(false);
      await fetchOwnedCommunities();
      await fetchDiscoverCommunities(currentPage);
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
      setFormData({ name: "", description: "", visibility: "public" });
      setEditingCommunity(null);
      await fetchOwnedCommunities();
      await fetchDiscoverCommunities(currentPage);
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
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this community?")) return;

    setLoading(true);
    try {
      await communityApi.delete(communityId, userId);
      toast({
        title: "Success",
        description: "Community deleted successfully",
      });
      await fetchOwnedCommunities();
      await fetchDiscoverCommunities(currentPage);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete community",
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

  // Check if user is member of a community
  const isMember = (communityId: string) => {
    return (
      joinedCommunities.some((c) => c.id === communityId) ||
      ownedCommunities.some((c) => c.id === communityId)
    );
  };

  // Community Card component
  const CommunityCard = ({
    community,
    showJoinLeave = false,
    showManage = false,
    showStats = false,
  }: {
    community: Community;
    showJoinLeave?: boolean;
    showManage?: boolean;
    showStats?: boolean;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {community.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  community.visibility === "public" ? "default" : "secondary"
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
          </div>
          {showManage && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(community)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(community.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {community.description || "No description provided"}
        </p>

        {showStats && communityStats[community.id] && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">
                {communityStats[community.id].totalMembers}
              </p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">
                {communityStats[community.id].totalPosts}
              </p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-600">
                {(
                  communityStats[community.id].activeEngagementRate * 100
                ).toFixed(1)}
                %
              </p>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {showJoinLeave && (
          <>
            {isMember(community.id) ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleLeave(community.id)}
                disabled={loading}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Leave
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => handleJoin(community.id)}
                disabled={loading}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Join
              </Button>
            )}
          </>
        )}
        {showManage && !communityStats[community.id] && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fetchStatistics(community.id)}
            disabled={statsLoading === community.id}
          >
            {statsLoading === community.id ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            View Stats
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Communities</h1>
            <p className="text-muted-foreground mt-2">
              Discover, join, and manage communities
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Button>
        </div>

        {/* Auth Warning */}
        {!userId && (
          <Alert className="mb-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-950">
            <AlertDescription>
              Please log in to create or manage communities.
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
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        visibility: value as "public" | "private",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Public
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" /> Private
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
                    {editingCommunity ? "Update" : "Create"}
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

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="joined">Joined</TabsTrigger>
            <TabsTrigger value="my-communities">My Communities</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          {/* Joined Communities Tab */}
          <TabsContent value="joined">
            {joinedCommunities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    You haven&apos;t joined any communities yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("discover")}
                  >
                    Discover Communities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {joinedCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    showJoinLeave
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Communities Tab (Owned) */}
          <TabsContent value="my-communities">
            {ownedCommunities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    You don&apos;t own any communities yet.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Community
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Owned Communities Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ownedCommunities.map((community) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      showManage
                      showStats
                    />
                  ))}
                </div>

                {/* Admin Section */}
                <div className="border-t pt-8">
                  <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>

                  <Tabs defaultValue="pending-posts">
                    <TabsList>
                      <TabsTrigger
                        value="pending-posts"
                        onClick={() => fetchPendingPosts()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Pending Posts
                      </TabsTrigger>
                      <TabsTrigger
                        value="pending-members"
                        onClick={() => fetchPendingMembers()}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join Requests
                      </TabsTrigger>
                      <TabsTrigger
                        value="reports"
                        onClick={() => fetchPendingReports()}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Reports
                      </TabsTrigger>
                    </TabsList>

                    {/* Pending Posts */}
                    <TabsContent value="pending-posts" className="mt-4">
                      {loadingPending ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : pendingPosts.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            No pending posts to review.
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {pendingPosts.map((post) => (
                            <Card key={post.id}>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  {post.title}
                                </CardTitle>
                                <CardDescription>
                                  By {post.author_name || post.user_id} •{" "}
                                  {new Date(post.created_at).toLocaleString()}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {post.content}
                                </p>
                              </CardContent>
                              <CardFooter className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprovePost(post.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectPost(post.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Pending Members / Join Requests */}
                    <TabsContent value="pending-members" className="mt-4">
                      {loadingPending ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : pendingMembers.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            No pending join requests to review.
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {pendingMembers.map((member) => (
                            <Card
                              key={`${member.community_id}-${member.user_id}`}
                            >
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <UserPlus className="h-5 w-5 text-blue-500" />
                                  {member.username ||
                                    member.email ||
                                    member.user_id}
                                </CardTitle>
                                <CardDescription>
                                  Wants to join{" "}
                                  <strong>{member.community_name}</strong> •{" "}
                                  {new Date(
                                    member.requested_at
                                  ).toLocaleString()}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">
                                  User: {member.email || member.user_id}
                                </p>
                              </CardContent>
                              <CardFooter className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApproveMember(
                                      member.community_id,
                                      member.user_id
                                    )
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleRejectMember(
                                      member.community_id,
                                      member.user_id
                                    )
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Reports */}
                    <TabsContent value="reports" className="mt-4">
                      {loadingPending ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : pendingReports.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            No pending reports to review.
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {pendingReports.map((report) => (
                            <Card key={report.id}>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                  {report.reported_entity_type} Report
                                </CardTitle>
                                <CardDescription>
                                  Reported on{" "}
                                  {new Date(report.created_at).toLocaleString()}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm">
                                  <strong>Reason:</strong> {report.reason}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Entity ID: {report.reported_entity_id}
                                </p>
                              </CardContent>
                              <CardFooter className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReportDecision(report.id, "APPROVE")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Take Action
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleReportDecision(report.id, "REJECT")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Dismiss
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover">
            {discoverCommunities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No communities found.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create the first community
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {discoverCommunities.map((community) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      showJoinLeave
                    />
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
