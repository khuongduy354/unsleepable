import { ITagService, ITagRepository, Tag } from "../types/tag.type";
import { ICommunityService } from "./community.service";
import { IPostRepository } from "../types/post.type";

export class TagService implements ITagService {
  constructor(
    private tagRepository: ITagRepository,
    private communityService: ICommunityService, // <-- Đã thêm
    private postRepository: IPostRepository // <-- Cần để lấy communityId của post
  ) {}
  async processAndLinkTags(postId: string, tagNames: string[]): Promise<Tag[]> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found.");
    }
    const communityId = post.community_id;
    const processedTags: Tag[] = [];

    // Chuẩn hóa và lọc trùng lặp tên tags
    const uniqueTagNames = [
      ...new Set(tagNames.map((name) => name.trim().toLowerCase())),
    ];

    for (const tagName of uniqueTagNames) {
      let tag = await this.tagRepository.findByName(tagName);

      if (!tag) {
        tag = await this.tagRepository.create({ Name: tagName });
      }
      await this.tagRepository.addTagToPost(postId, tag.id);
      await this.communityService.syncTagToCommunity(communityId, tagName);

      processedTags.push(tag);
    }

    return processedTags;
  }

  async getTagsForPost(postId: string): Promise<Tag[]> {
    return await this.tagRepository.getTagsByPostId(postId);
  }

  async getAllTags(): Promise<Tag[]> {
    return await this.tagRepository.findAll();
  }

  async getTagsByCommunity(communityId: string): Promise<Tag[]> {
    return await this.tagRepository.findByCommunityId(communityId);
  }
}
