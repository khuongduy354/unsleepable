import { PostService } from "./post.service";
import { MockPostRepository } from "../repositories/mock/post.repository.mock";
import { CreatePostDTO, Post } from "../types/post.type";

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
    it("should throw error when trying to delete non-existent post", async () => {
      // Act & Assert
      await expect(postService.deletePost("non-existent-id")).rejects.toThrow(
        "Post not found"
      );
    });
  });
});
