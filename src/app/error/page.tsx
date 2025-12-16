import React from "react";

type Props = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function ErrorPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const message = params.message ?? "An error occurred. Check server logs for details.";

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-xl border p-6">
        <h1 className="text-xl font-semibold mb-2">Error</h1>
        <p className="text-sm opacity-80">{message}</p>
      </div>
    </main>
  );
}
