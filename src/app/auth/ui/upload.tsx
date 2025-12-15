"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function UploadButton() {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  async function handleUpload(e: React.ChangeEvent<HTMLInputElements>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);


 try {
      const formData = new FormData();
      formData.append("file", file);

       const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      // Server returned HTML or plain text instead of JSON
      const text = await response.text();
      console.error("Server response (not JSON):", text);
      throw new Error(`Server error: ${text.substring(0, 200)}`);
    }

      if (!response.ok) {
        throw new Error("Upload failed");
      }


      console.log("Upload successful:", response.url);
      setFileUrl(response.url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input 
        type="file" 
        onChange={handleUpload} 
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {fileUrl && (
        <div>
          <p>Upload successful!</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          </a>
        </div>
      )}
    </div>
  );
}
