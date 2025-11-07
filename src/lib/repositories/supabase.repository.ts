import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreatePostDTO,
  UpdatePostDTO,
  Post,
  IPostRepository,
} from "../types/post.type";

export class SupabasePostRepository implements IPostRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreatePostDTO): Promise<Post> {
    const { data: post, error } = await this.supabase
      .from("posts")
      .insert({
        title: data.title,
        content: data.content,
        author_id: data.author_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return post;
  }

  async findById(id: string): Promise<Post | null> {
    const { data: post, error } = await this.supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to find post: ${error.message}`);
    }

    return post;
  }

  async findAll(): Promise<Post[]> {
    const { data: posts, error } = await this.supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    return posts || [];
  }

  async findByAuthorId(authorId: string): Promise<Post[]> {
    const { data: posts, error } = await this.supabase
      .from("posts")
      .select("*")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by author: ${error.message}`);
    }

    return posts || [];
  }

  async update(id: string, data: UpdatePostDTO): Promise<Post> {
    const { data: post, error } = await this.supabase
      .from("posts")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }

    return post;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("posts").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }
}
