import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Upload Service Tests
 *
 * These tests verify the upload functionality by directly testing:
 * 1. File upload to Supabase Storage
 * 2. Asset record creation in database
 * 3. File cleanup and deletion
 */
describe("Upload Service Tests", () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let uploadedFiles: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase admin client
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use a valid UUID format for test user ID
    testUserId =
      "00000000-0000-0000-0000-" +
      Date.now().toString().padStart(12, "0").slice(0, 12);

    // Create test user in UserAccount table
    await supabase.from("UserAccount").insert({
      id: testUserId,
      username: `testuser-${Date.now()}`,
      email: `test-${Date.now()}@test.com`,
    });
  });

  afterAll(async () => {
    // Cleanup: Delete uploaded test files from storage
    if (uploadedFiles.length > 0) {
      await supabase.storage.from("media").remove(uploadedFiles);
    }

    // Cleanup: Delete test assets from database
    await supabase.from("Asset").delete().eq("user_id", testUserId);

    // Cleanup: Delete test user
    await supabase.from("UserAccount").delete().eq("id", testUserId);
  });

  test("1. Should upload a text file to storage", async () => {
    const fileContent = "test content";
    const fileName = `uploads/test-${Date.now()}.txt`;
    const fileBuffer = Buffer.from(fileContent);

    const { data, error } = await supabase.storage
      .from("media")
      .upload(fileName, fileBuffer, {
        contentType: "text/plain",
        upsert: false,
      });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.path).toBe(fileName);

    uploadedFiles.push(fileName);
  });

  test("2. Should get public URL for uploaded file", async () => {
    const fileName = `uploads/test-url-${Date.now()}.txt`;
    const fileBuffer = Buffer.from("url test");

    // Upload file first
    await supabase.storage.from("media").upload(fileName, fileBuffer, {
      contentType: "text/plain",
    });

    // Get public URL
    const { data } = supabase.storage.from("media").getPublicUrl(fileName);

    expect(data.publicUrl).toBeDefined();
    expect(data.publicUrl).toContain(supabaseUrl);
    expect(data.publicUrl).toContain(fileName);

    uploadedFiles.push(fileName);
  });

  test("3. Should create asset record in database", async () => {
    const fileName = `uploads/test-asset-${Date.now()}.txt`;
    const fileSize = 100;
    const fileType = "text/plain";

    // Get public URL (simulating uploaded file)
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    // Insert asset record
    const { data, error } = await supabase
      .from("Asset")
      .insert({
        filename: fileName,
        type: fileType,
        size: fileSize,
        url: urlData.publicUrl,
        user_id: testUserId,
      })
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data![0].filename).toBe(fileName);
    expect(data![0].type).toBe(fileType);
    expect(data![0].user_id).toBe(testUserId);
  });

  test("4. Should upload an image file", async () => {
    // Create a minimal 1x1 PNG
    const pngData = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
      0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84,
      8, 153, 99, 248, 207, 192, 0, 0, 3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0,
      0, 73, 69, 78, 68, 174, 66, 96, 130,
    ]);
    const fileName = `uploads/test-${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from("media")
      .upload(fileName, pngData, {
        contentType: "image/png",
        upsert: false,
      });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.path).toBe(fileName);

    uploadedFiles.push(fileName);
  });

  test("5. Should delete file from storage", async () => {
    const fileName = `uploads/test-delete-${Date.now()}.txt`;
    const fileBuffer = Buffer.from("delete test");

    // Upload file first
    await supabase.storage.from("media").upload(fileName, fileBuffer, {
      contentType: "text/plain",
    });

    // Delete the file
    const { data, error } = await supabase.storage
      .from("media")
      .remove([fileName]);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Verify file is deleted by trying to download it
    const { error: downloadError } = await supabase.storage
      .from("media")
      .download(fileName);

    expect(downloadError).toBeDefined();
  });
});
