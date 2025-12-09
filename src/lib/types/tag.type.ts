export interface Tag {
  id: string;
  Name: string;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
}
export interface CreateTagDTO {
  Name: string;
}

export interface ITagRepository {
  create(data: CreateTagDTO): Promise<Tag>;
  findByName(name: string): Promise<Tag | null>;
  addTagToPost(postId: string, tagId: string): Promise<PostTag | null>;
  getTagsByPostId(postId: string): Promise<Tag[]>;
}

export interface ITagService {
  processAndLinkTags(postId: string, tagNames: string[]): Promise<Tag[]>;
  getTagsForPost(postId: string): Promise<Tag[]>;
}