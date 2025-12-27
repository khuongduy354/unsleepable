'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  community_id: string;
  created_at: string;
  updated_at: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface Report {
  id: string;
  reporter_user_id: string;
  reason: string;
  status: string;
  created_at: string;
  reported_post_id: string | null;
  reported_comment_id: string | null;
}

export default function AdminPage() {
  // Pending Posts State
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [processingPostId, setProcessingPostId] = useState<string | null>(null);

  // Pending Reports State
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);

  // Fetch Pending Posts
  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    setPostsLoading(true);
    setPostsError('');
    try {
      const response = await fetch('/api/admin/posts/pending');
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      setPendingPosts(data.posts || []);
    } catch (error) {
      setPostsError(error instanceof Error ? error.message : 'Failed to fetch pending posts');
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch Pending Reports
  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const response = await fetch('/api/admin/reports/pending');
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      setPendingReports(data.reports || []);
    } catch (error) {
      setReportsError(error instanceof Error ? error.message : 'Failed to fetch pending reports');
    } finally {
      setReportsLoading(false);
    }
  };

  // Handle Post Approval
  const handleApprovePost = async (postId: string) => {
    setProcessingPostId(postId);
    try {
      const response = await fetch(`/api/admin/posts/${postId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      // Remove from pending list
      setPendingPosts(pendingPosts.filter((p) => p.id !== postId));
    } catch (error) {
      setPostsError(error instanceof Error ? error.message : 'Failed to approve post');
    } finally {
      setProcessingPostId(null);
    }
  };

  // Handle Post Rejection
  const handleRejectPost = async (postId: string) => {
    setProcessingPostId(postId);
    try {
      const response = await fetch(`/api/admin/posts/${postId}/reject`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      // Remove from pending list
      setPendingPosts(pendingPosts.filter((p) => p.id !== postId));
    } catch (error) {
      setPostsError(error instanceof Error ? error.message : 'Failed to reject post');
    } finally {
      setProcessingPostId(null);
    }
  };

  // Handle Report Decision
  const handleReportDecision = async (reportId: string, decision: 'APPROVE' | 'REJECT') => {
    setProcessingReportId(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      // Remove from pending list
      setPendingReports(pendingReports.filter((r) => r.id !== reportId));
    } catch (error) {
      setReportsError(error instanceof Error ? error.message : 'Failed to handle report decision');
    } finally {
      setProcessingReportId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600 mb-8">Quản lý pending posts và reported posts</p>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">
              Pending Posts ({pendingPosts.length})
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reported Posts ({pendingReports.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Pending Posts</CardTitle>
                <CardDescription>
                  Duyệt và phê duyệt các bài viết đang chờ xử lý
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {postsError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">
                      {postsError}
                    </AlertDescription>
                  </Alert>
                )}

                {postsLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                {!postsLoading && pendingPosts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Không có bài viết nào đang chờ duyệt
                  </p>
                )}

                {pendingPosts.map((post) => (
                  <Card key={post.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {post.content.substring(0, 150)}
                            {post.content.length > 150 ? '...' : ''}
                          </p>
                        </div>

                        <div className="flex gap-2 text-sm text-gray-500">
                          <span>ID: {post.id}</span>
                          <span>|</span>
                          <span>User: {post.user_id}</span>
                          <span>|</span>
                          <span>
                            Created: {new Date(post.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApprovePost(post.id)}
                            disabled={processingPostId === post.id}
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingPostId === post.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Phê duyệt
                          </Button>
                          <Button
                            onClick={() => handleRejectPost(post.id)}
                            disabled={processingPostId === post.id}
                            variant="destructive"
                          >
                            {processingPostId === post.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {!postsLoading && pendingPosts.length > 0 && (
                  <Button
                    onClick={fetchPendingPosts}
                    variant="outline"
                    className="w-full"
                  >
                    Làm mới
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reported Posts Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reported Posts & Comments</CardTitle>
                <CardDescription>
                  Xem xét các báo cáo vi phạm từ người dùng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportsError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">
                      {reportsError}
                    </AlertDescription>
                  </Alert>
                )}

                {reportsLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                {!reportsLoading && pendingReports.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Không có báo cáo nào đang chờ xử lý
                  </p>
                )}

                {pendingReports.map((report) => (
                  <Card key={report.id} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              Báo cáo {report.reported_post_id ? 'Post' : 'Comment'}
                            </h3>
                            <p className="text-sm text-gray-700 mt-2">
                              <strong>Lý do:</strong> {report.reason}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {report.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                          <span>Report ID: {report.id}</span>
                          <span>
                            Reported Entity:{' '}
                            {report.reported_post_id || report.reported_comment_id}
                          </span>
                          <span>Reporter: {report.reporter_user_id}</span>
                          <span>
                            Created: {new Date(report.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleReportDecision(report.id, 'APPROVE')}
                            disabled={processingReportId === report.id}
                            variant="default"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {processingReportId === report.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Phê duyệt báo cáo
                          </Button>
                          <Button
                            onClick={() => handleReportDecision(report.id, 'REJECT')}
                            disabled={processingReportId === report.id}
                            variant="outline"
                          >
                            {processingReportId === report.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Từ chối báo cáo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {!reportsLoading && pendingReports.length > 0 && (
                  <Button
                    onClick={fetchPendingReports}
                    variant="outline"
                    className="w-full"
                  >
                    Làm mới
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
