"use client";

import { Post } from "@/lib/types/post.type";
import { useState, useEffect } from "react";
import CommentList from "./CommentList";
import { commentApi } from "@/lib/api";

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});

  const loadComments = async (postId: string) => {
    try {
      const comments = await commentApi.getByPostId(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      loadComments(postId);
    }
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <h3 className="text-xl font-semibold">{post.title}</h3>
          <p className="text-gray-600 mt-2">{post.content}</p>
          <div className="flex gap-4 items-center mt-2 text-sm text-gray-400">
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            <button
              onClick={() => toggleComments(post.id)}
              className="text-blue-500 hover:underline"
            >
              {expandedPost === post.id ? "Hide" : "Show"} Comments
            </button>
          </div>

          {expandedPost === post.id && (
            <div className="mt-4 pl-4 border-l-2">
              <CommentList
                postId={post.id}
                initialComments={commentsMap[post.id] || []}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
