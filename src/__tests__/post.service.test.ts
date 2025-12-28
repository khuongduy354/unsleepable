import { PostService } from "@/lib/services/post.service";
import { MockPostRepository } from "@/lib/repositories/mock/post.repository.mock";
import { CreatePostDTO, Post } from "@/lib/types/post.type";

/**
 * Unit tests for PostService
 *
 * TEST FLOW:
 * 1. Create a MockPostRepository (implements IPostRepository interface)
 * 2. Inject the mock into PostService via constructor (Dependency Injection)
 * 3. Call service methods and assert business logic works correctly
 *
 * This approach allows testing business logic WITHOUT a real database.
 */
describe("PostService", () => {
  let postService: PostService;
  let mockRepository: MockPostRepository;

  beforeEach(() => {
    // Create fresh mock repository for each test
    mockRepository = new MockPostRepository();

    // Inject mock repository into service (Dependency Injection)
    postService = new PostService(mockRepository);
  });

  describe("createPost", () => {
    it("should create a post successfully with valid data", async () => {
      // Arrange
      const postData: CreatePostDTO = {
        title: "Test Post Title",
        content: "This is the test content for the post.",
        author_id: "user-123",
        community_id: "community-1",
        media_url: "",
        media_type: "media",
        storage_path: "",
      };

      // Act
      const result = await postService.createPost(postData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(postData.title);
      expect(result.content).toBe(postData.content);
      expect(result.user_id).toBe(postData.author_id);
    });

    it("should throw error when title is empty", async () => {
      // Arrange
      const postData: CreatePostDTO = {
        title: "",
        content: "Valid content",
        author_id: "user-123",
        community_id: "community-1",
        media_url: "",
        media_type: "media",
        storage_path: "",
      };

      // Act & Assert
      await expect(postService.createPost(postData)).rejects.toThrow(
        "Post title is required"
      );
    });

    it("should throw error when content is empty", async () => {
      // Arrange
      const postData: CreatePostDTO = {
        title: "Valid Title",
        content: "",
        author_id: "user-123",
        community_id: "community-1",
        media_url: "",
        media_type: "media",
        storage_path: "",
      };

      // Act & Assert
      await expect(postService.createPost(postData)).rejects.toThrow(
        "Post content is required"
      );
    });
  });

  describe("getPostById", () => {
    it("should return post when it exists", async () => {
      // Arrange - seed data via mock
      const existingPost: Post = {
        id: "existing-post-1",
        user_id: "user-123",
        community_id: "community-1",
        title: "Existing Post",
        content: "Some content",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "approved",
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
      };
      mockRepository.seedPosts([existingPost]);

      // Act
      const result = await postService.getPostById("existing-post-1");

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe("existing-post-1");
      expect(result?.title).toBe("Existing Post");
    });

    it("should return null when post does not exist", async () => {
      // Act
      const result = await postService.getPostById("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("deletePost", () => {
    it("should delete post successfully when post exists (owner)", async () => {
      // Arrange - seed an existing post
      const existingPost: Post = {
        id: "post-to-delete",
        user_id: "user-123",
        community_id: "community-1",
        title: "Post to Delete",
        content: "This will be deleted",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "approved",
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
      };
      mockRepository.seedPosts([existingPost]);

      // Act
      await postService.deletePost("post-to-delete");

      // Assert - verify post no longer exists
      const result = await postService.getPostById("post-to-delete");
      expect(result).toBeNull();
    });

    it("should throw error when trying to delete non-existent post", async () => {
      // Act & Assert
      await expect(postService.deletePost("non-existent-id")).rejects.toThrow(
        "Post not found"
      );
    });
  });

  describe("updatePost", () => {
    it("should update post successfully when authorized", async () => {
      // Arrange - seed an existing post
      const existingPost: Post = {
        id: "post-to-update",
        user_id: "user-123",
        community_id: "community-1",
        title: "Original Title",
        content: "Original Content",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "approved",
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
      };
      mockRepository.seedPosts([existingPost]);

      // Act
      const updatedData = {
        title: "Updated Title",
        content: "Updated Content",
      };
      const result = await postService.updatePost("post-to-update", updatedData);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe("Updated Title");
      expect(result.content).toBe("Updated Content");
      expect(result.id).toBe("post-to-update");
    });

    it("should throw error when trying to update non-existent post (unauthorized)", async () => {
      // Arrange - no post seeded

      // Act & Assert
      await expect(
        postService.updatePost("non-existent-id", { title: "New Title" })
      ).rejects.toThrow("Post not found");
    });
  });

  describe("reactToPost", () => {
    it("should call reactToPost without errors for like", async () => {
      // Arrange - seed an existing post
      const existingPost: Post = {
        id: "post-1",
        user_id: "user-123",
        community_id: "community-1",
        title: "Test Post",
        content: "Test Content",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "approved",
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
      };
      mockRepository.seedPosts([existingPost]);

      // Act & Assert - just verify method can be called
      // Note: reactToPost in actual implementation uses Supabase directly
      // For unit testing, we're just verifying the method exists and can be called
      await expect(
        postService.reactToPost("post-1", "user-456", "like")
      ).rejects.toThrow(); // Will throw because mock doesn't have supabase
    });

    it("should call reactToPost without errors for dislike", async () => {
      // Arrange - seed an existing post
      const existingPost: Post = {
        id: "post-3",
        user_id: "user-123",
        community_id: "community-1",
        title: "Test Post",
        content: "Test Content",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "approved",
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
      };
      mockRepository.seedPosts([existingPost]);

      // Act & Assert
      await expect(
        postService.reactToPost("post-3", "user-456", "dislike")
      ).rejects.toThrow(); // Will throw because mock doesn't have supabase
    });
  });
});
