"use client";

import { Comment } from "@/lib/types/post.type";
import { useState, useEffect } from "react";
import { commentApi } from "@/lib/api";

interface CommentListProps {
  postId: string;
  initialComments: Comment[];
}

export default function CommentList({
  postId,
  initialComments,
}: CommentListProps) {
  const [comments, setComments] = useState(initialComments);
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const loadReplies = async (commentId: string) => {
    if (replies[commentId]) return;

    try {
      const data = await commentApi.getReplies(commentId);
      setReplies({ ...replies, [commentId]: data });
    } catch (error) {
      console.error("Error loading replies:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = await commentApi.create({
        content: newComment,
        post_id: postId,
        user_id: "d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234",
      });

      setComments([comment, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const reply = await commentApi.create({
        content: replyContent,
        post_id: postId,
        parent_comment_id: parentId,
        user_id: "d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234",
      });

      const currentReplies = replies[parentId] || [];
      setReplies({ ...replies, [parentId]: [...currentReplies, reply] });
      setReplyContent("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const toggleReplies = (commentId: string) => {
    if (!replies[commentId]) {
      loadReplies(commentId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleAddComment}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Post
        </button>
      </div>

      {comments.map((comment) => (
        <div key={comment.id}>
          <div className="border rounded p-4">
            <p>{comment.content}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-blue-500"
              >
                Reply
              </button>
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-gray-600"
              >
                {replies[comment.id]
                  ? `${replies[comment.id].length} replies`
                  : "Show replies"}
              </button>
            </div>

            {replyTo === comment.id && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Add a reply..."
                  className="flex-1 border rounded px-3 py-2"
                />
                <button
                  onClick={() => handleAddReply(comment.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Reply
                </button>
                <button
                  onClick={() => setReplyTo(null)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {replies[comment.id] && replies[comment.id].length > 0 && (
            <div className="ml-8 mt-2 space-y-2">
              {replies[comment.id].map((reply) => (
                <div key={reply.id} className="border rounded p-3 bg-gray-50">
                  <p className="text-sm">{reply.content}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
