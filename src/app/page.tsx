"use client";

import { useState } from "react";
import { SupabasePostRepository } from "@/lib/repositories/supabase.repository";
import { supabase } from "@/utils/supabase/client";

const postRepo = new SupabasePostRepository(supabase);

export default function TestPostPage() {
  const [searchId, setSearchId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [userId, setUserId] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // UPDATE inputs
  const [updateId, setUpdateId] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");

  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");

  // 🔍 Tìm kiếm theo ID
  const handleSearchById = async () => {
    if (!searchId) return setResult("Hãy nhập ID!");

    try {
      const post = await postRepo.findById(searchId);

      if (!post) setResult("Không tìm thấy post!");
      else setResult(JSON.stringify(post, null, 2));
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
  };
  // 🔍 Tìm kiếm theo user ID
  const handleSearchByUserId = async () => {
    if (!userId) return setResult("Hãy nhập ID!");

    try {
      const post = await postRepo.findByUserId(userId);

      if (!post) setResult("Không tìm thấy post!");
      else setResult(JSON.stringify(post, null, 2));
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
  };

  // 📚 Lấy toàn bộ Post
  const handleFindAll = async () => {
    try {
      const posts = await postRepo.findAll();
      setResult(JSON.stringify(posts, null, 2));
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
  };

  // ➕ Insert Post
  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) return setMessage("Hãy nhập đủ title và content!");

    try {
      const newPost = await postRepo.create({ title, content });
      setMessage(`Insert thành công! ID = ${newPost.id}`);

      setTitle("");
      setContent("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  // ✏️ Update Post
  const handleUpdate = async () => {
    if (!updateId) return setMessage("Hãy nhập ID để update!");

    try {
      const updated = await postRepo.update(updateId, {
        title: updateTitle || undefined,
        content: updateContent || undefined,
      });

      setMessage(`Update thành công! ID = ${updated.id}`);
      setUpdateId("");
      setUpdateTitle("");
      setUpdateContent("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  // ❌ Delete Post
  const handleDelete = async () => {
    if (!deleteId) return setMessage("Hãy nhập ID để xoá!");

    try {
      await postRepo.delete(deleteId);
      setMessage(`Xoá thành công post ID: ${deleteId}`);
      setDeleteId("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 flex flex-col gap-10">

        {/* SEARCH */}
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
        {/* Search by user ID */}
        <section>
          <h2 className="text-xl font-bold mb-3">🔍 Tìm Post theo user ID</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Nhập Post ID..."
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
            Hiển thị tất cả Post
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
              Insert
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
            placeholder="Title mới (tuỳ chọn)..."
            className="p-2 border rounded-md w-full mb-2"
          />

          <textarea
            value={updateContent}
            onChange={(e) => setUpdateContent(e.target.value)}
            placeholder="Content mới (tuỳ chọn)..."
            className="p-2 border rounded-md w-full mb-2"
            rows={3}
          />

          <button
            onClick={handleUpdate}
            className="bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700"
          >
            Update
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
              Delete
            </button>
          </div>
        </section>

        {/* COMMON MESSAGE */}
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}

        {/* RESULT VIEW */}
        {result && (
          <pre className="mt-4 bg-gray-200 p-3 rounded text-sm overflow-auto">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}



// "use client";

// import { useState } from "react";
// import { v4 as uuidv4 } from "uuid";
// import { SupabasePostRepository } from "@/lib/repositories/supabase.repository";
// import { supabase } from "@/utils/supabase/client";

// const postRepo = new SupabasePostRepository(supabase);

// export default function InsertUserPage() {
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [message, setMessage] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!title || !content) {
//       setMessage("Vui lòng nhập đầy đủ thông tin!");
//       return;
//     }

//     try {
//       const newPost = await postRepo.create({
//         title: title,
//         content: content
//       });

//       setMessage(`Insert thành công! New Post: ${newPost.title}`);

//       setTitle("");
//       setContent("");
//     } catch (err: any) {
//       setMessage(`Error: ${err.message}`);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
//       <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
//         <h1 className="text-2xl font-bold mb-4 text-center">Create New Post</h1>

//         <form onSubmit={handleSubmit} className="flex flex-col gap-4">

//           <label className="flex flex-col text-gray-700 font-medium">
//             Title
//             <input
//               type="text"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               className="mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               required
//             />
//           </label>

//           <label className="flex flex-col text-gray-700 font-medium">
//             Content
//             <textarea
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               className="mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               rows={4}
//               required
//             />
//           </label>

//           <button
//             type="submit"
//             className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
//           >
//             Insert Post
//           </button>

//         </form>

//         {message && (
//           <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
//         )}
//       </div>
//     </div>
//   );
// }
