"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { SupabasePostRepository } from "@/lib/repositories/supabase.repository";
import { supabase } from "@/utils/supabase/client";

const postRepo = new SupabasePostRepository(supabase);

export default function InsertUserPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) {
      setMessage("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const newPost = await postRepo.create({
        title: title,
        content: content
      });

      setMessage(`Insert thành công! New Post: ${newPost.title}`);

      setTitle("");
      setContent("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Create New Post</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <label className="flex flex-col text-gray-700 font-medium">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </label>

          <label className="flex flex-col text-gray-700 font-medium">
            Content
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </label>

          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
          >
            Insert Post
          </button>

        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}
