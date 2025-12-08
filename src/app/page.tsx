"use client";

import { useState } from "react";
import UploadButton from "./auth/ui/upload.tsx";
import ShortUrlSetter from "./auth/ui/shortUrl.tsx" 

export default function TestPostPage() {
  // State quản lý Input
  const [searchId, setSearchId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [userId, setUserId] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // UPDATE inputs
  const [updateId, setUpdateId] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateShortUrl, setUpdateShortUrl] = useState("");
  // State hiển thị kết quả
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");

  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // --- CÁC HÀM GỌI API (FETCH) ---

  // 🔍 1. Tìm kiếm theo ID (GET /api/post/[id])
  const handleSearchById = async () => {
    if (!searchId) return setResult("Hãy nhập ID!");

    try {
      const res = await fetch(`/api/post/${searchId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi gọi API");

      setResult(JSON.stringify(data.post, null, 2));
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
  };

  // 🔍 2. Tìm kiếm theo User ID (GET /api/post?authorId=...)
  const handleSearchByUserId = async () => {
    if (!userId) return setResult("Hãy nhập User ID!");

    try {
      const res = await fetch(`/api/post?authorId=${userId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi gọi API");

      setResult(JSON.stringify(data.post, null, 2));
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
  };

  // 📚 3. Lấy toàn bộ Post (GET /api/post)
  const handleFindAll = async () => {
    try {
      const res = await fetch("/api/post");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi gọi API");

      setResult(JSON.stringify(data.posts, null, 2));
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
  };

  // ➕ 4. Insert Post (POST /api/post)
  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return setMessage("Hãy nhập đủ title và content!");

    try {
      // Vì chưa có Auth, ta tạm thời gửi kèm user_id giả nếu Service yêu cầu
      // Hoặc nếu Repository đã hardcode fakeUserId thì không cần dòng user_id dưới đây
      const payload = { 
        title, 
        content,
        user_id: "test-user-id-from-client" // Tùy chọn, tùy vào Service validation
      };

      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Insert thất bại");

      setMessage(`Insert thành công! ID = ${data.post.id}`);
      setTitle("");
      setContent("");
      // Refresh lại danh sách nếu cần
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  // ✏️ 5. Update Post (PATCH /api/post/[id])
  const handleUpdate = async () => {
    if (!updateId) return setMessage("Hãy nhập ID để update!");

    try {
      const payload = {
        title: updateTitle || undefined,
        content: updateContent || undefined,
        shortUrl: updateShortUrl || undefined,
      };

      const res = await fetch(`/api/post/${updateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update thất bại");

      setMessage(`Update thành công! ID = ${data.post.id}`);
      setUpdateId("");
      setUpdateTitle("");
      setUpdateContent("");
      setUpdateShortUrl("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  // ❌ 6. Delete Post (DELETE /api/post/[id])
  const handleDelete = async () => {
    if (!deleteId) return setMessage("Hãy nhập ID để xoá!");

    try {
      const res = await fetch(`/api/post/${deleteId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xoá thất bại");

      setMessage(`Xoá thành công post ID: ${deleteId}`);
      setDeleteId("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };


  // --- PHẦN GIAO DIỆN (GIỮ NGUYÊN KHÔNG ĐỔI) ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 flex flex-col gap-10">
        
        {/* SEARCH ID */}
        <section>
          <h2 className="text-xl font-bold mb-3">🔍 Tìm Post theo ID</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Nhập Post ID..."
              className="flex-1 p-2 border rounded-md"
            />
            <button
              onClick={handleSearchById}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </section>
<UploadButton />
        {/* SEARCH USER ID */}
        <section>
          <h2 className="text-xl font-bold mb-3">🔍 Tìm Post theo User ID</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Nhập User ID..."
              className="flex-1 p-2 border rounded-md"
            />
            <button
              onClick={handleSearchByUserId}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </section>

        {/* FIND ALL */}
        <section>
          <h2 className="text-xl font-bold mb-3">📚 Lấy toàn bộ Post</h2>
          <button
            onClick={handleFindAll}
            className="w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800"
          >
            Hiển thị tất cả Post (API)
          </button>
        </section>

        {/* INSERT */}
        <section>
          <h2 className="text-xl font-bold mb-3">➕ Thêm Post mới</h2>
          <form onSubmit={handleInsert} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 border rounded-md"
            />
            <textarea
              placeholder="Content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="p-2 border rounded-md"
              rows={4}
            />
            <button
              type="submit"
              className="bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
            >
              Insert via API
            </button>
          </form>
        </section>

        {/* UPDATE */}
        <section>
          <h2 className="text-xl font-bold mb-3">✏️ Update Post theo ID</h2>
          <input
            type="text"
            value={updateId}
            onChange={(e) => setUpdateId(e.target.value)}
            placeholder="ID cần update..."
            className="p-2 border rounded-md w-full mb-2"
          />
          <input
            type="text"
            value={updateTitle}
            onChange={(e) => setUpdateTitle(e.target.value)}
            placeholder="Title mới..."
            className="p-2 border rounded-md w-full mb-2"
          />
          <textarea
            value={updateContent}
            onChange={(e) => setUpdateContent(e.target.value)}
            placeholder="Content mới..."
            className="p-2 border rounded-md w-full mb-2"
            rows={3}
          />
<input
    type="text"
    value={updateShortUrl}
    onChange={(e) => setUpdateShortUrl(e.target.value)}
    placeholder="Short URL mới... (ví dụ: my-post-is-dumb)"
    className="p-2 border rounded-md w-full mb-2"
  />
          <button
            onClick={handleUpdate}
            className="bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700"
          >
            Update via API
          </button>
        </section>

        {/* DELETE */}
        <section>
          <h2 className="text-xl font-bold mb-3">❌ Xoá Post theo ID</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
              placeholder="Nhập Post ID để xoá..."
              className="flex-1 p-2 border rounded-md"
            />
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Delete via API
            </button>
          </div>
        </section>

        {/* MESSAGES */}
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700 font-semibold">{message}</p>
        )}
        {result && (
          <pre className="mt-4 bg-gray-200 p-3 rounded text-sm overflow-auto max-h-96">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}
