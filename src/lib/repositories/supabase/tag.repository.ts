import { SupabaseClient } from "@supabase/supabase-js";
import { ITagRepository, Tag, CreateTagDTO, PostTag } from "../../types/tag.type";

export class SupabaseTagRepository implements ITagRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateTagDTO): Promise<Tag> {
    const { data: tag, error } = await this.supabase
      .from("Tag")
      .insert({ Name: data.Name })
      .select()
      .single();

    if (error) throw new Error(`Tag creation failed: ${error.message}`);
    return tag as Tag;
  }

  async findByName(name: string): Promise<Tag | null> {
    const { data: tag } = await this.supabase
      .from("Tag")
      .select("*")
      .eq("name", name)
      .single();

    return tag as Tag;
  }

  async addTagToPost(postId: string, tagId: string): Promise<PostTag | null> {
    const { data: postTag, error } = await this.supabase
      .from("PostTag")
      .insert({ post_id: postId, tag_id: tagId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') 
        return null; 
      throw new Error(`Linking tag failed: ${error.message}`);
    }

    return postTag as PostTag;
  }

  async getTagsByPostId(postId: string): Promise<Tag[]> {
    // Sử dụng JOIN (PostTag -> Tag) để lấy tên tags
    const { data: tags, error } = await this.supabase
      .from("PostTag")
      // Giả sử có sẵn các view/relationship để lấy dữ liệu Tag trực tiếp
      .select("tag_id, Tag(id, Name)") 
      .eq("post_id", postId);

    if (error) throw new Error(`Fetch tags failed: ${error.message}`);
    
    // Cần xử lý data trả về để mapping đúng kiểu Tag[]
    return (tags as any[]).map(t => t.Tag) as Tag[]; 
  }
}