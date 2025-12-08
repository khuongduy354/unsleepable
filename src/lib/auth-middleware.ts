import { NextRequest } from "next/server";

/**
 * Mock authentication middleware for extracting user ID from request headers
 * In production, this should be replaced with actual authentication logic
 *
 * For now, the frontend should include a 'x-user-id' header with the user's ID
 */

export function extractUserId(request: NextRequest): string | null {
  const userId = request.headers.get("x-user-id");
  return userId;
}

export function requireAuth(request: NextRequest): string {
  const userId = extractUserId(request);

  if (!userId) {
    throw new Error("Unauthorized: User ID not provided in headers");
  }

  return userId;
}
