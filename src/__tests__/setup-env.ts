import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local for tests
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Also try .env if .env.local doesn't exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}
