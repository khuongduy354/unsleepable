"use client";
import { useState, useEffect } from "react";

export default function ShortUrlSetter({ communityId, initial }) {
  const [slug, setSlug] = useState(initial || "");
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (slug.length < 3) {
      setAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/shorturl?slug=${encodeURIComponent(slug)}`);
      const j = await res.json();
      setAvailable(j.available);
    }, 300);
    return () => clearTimeout(t);
  }, [slug]);

  async function onSave() {
    if (!available) {
      alert("URL đã có người dùng");
      return;
    }
    const res = await fetch("/api/shorturl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId, shorturl: slug }),
    });
    const j = await res.json();
    if (j.success) {
      alert("Saved!");
    } else {
      alert("Lỗi: " + j.error);
    }
  }

  return (
    <div>
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="your-short-url"
      />
      {available === true && <p style={{ color: "green" }}>Available</p>}
      {available === false && <p style={{ color: "red" }}>Taken</p>}
      <button disabled={!available} onClick={onSave}>Save</button>
    </div>
  );
}
