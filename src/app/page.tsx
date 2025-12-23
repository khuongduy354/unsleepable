"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to posts page
    router.push("/posts");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to posts...</p>
    </div>
  );
}
