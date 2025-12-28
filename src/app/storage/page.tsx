"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  File,
  Trash2,
  ExternalLink,
  Image,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StorageFile {
  id: string;
  filename: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
}

export default function StoragePage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit] = useState(100 * 1024 * 1024); // 100MB limit
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            uploadFile(file);
            break;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      fetchStorageInfo();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFile(selectedFiles[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      uploadFile(droppedFiles[0]);
    }
  }, []);

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/storage");

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Not logged in",
            description: "Please log in to view your storage",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to fetch storage info");
      }

      const data = await response.json();
      setFiles(data.files || []);
      setStorageUsed(data.totalSize || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load storage information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete this file?`)) return;

    try {
      setDeleting(fileId);
      const response = await fetch(`/api/storage?id=${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      fetchStorageInfo();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith("image/")) {
      return <Image className="h-5 w-5 text-muted-foreground" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const getDisplayName = (filename: string) => {
    // Remove "uploads/" prefix and timestamp
    const name = filename.replace(/^uploads\/\d+-/, "");
    return name || filename;
  };

  const usagePercentage = (storageUsed / storageLimit) * 100;

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

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Storage</h1>
          <p className="text-muted-foreground mt-2">
            Manage your uploaded files and storage space
          </p>
        </div>

        {/* Storage Usage Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>
              {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={usagePercentage} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {usagePercentage.toFixed(1)}% of storage used
            </p>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Drag & drop, paste, or click to upload files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">
                    {isDragging
                      ? "Drop file here"
                      : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can also paste images from clipboard (Ctrl+V)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Files</CardTitle>
            <CardDescription>
              Files you've uploaded to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files uploaded yet</p>
                <p className="text-sm mt-2">
                  Upload images by pasting them in post creation
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getDisplayName(file.filename)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(file.size)} •{" "}
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleting === file.id}
                        onClick={() => handleDeleteFile(file.id, file.filename)}
                      >
                        {deleting === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
