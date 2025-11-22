import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreatePostDTO,
  UpdatePostDTO,
  Post,
  IPostRepository,
} from "../types/post.type";
import { v4 as uuidv4 } from "uuid";
const fakeUserId = "d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234"; // id có thật trong User
const fakeCommunityId = "6f346e21-93a1-48ee-b1c5-55791f44afcd";
export class SupabasePostRepository implements IPostRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreatePostDTO): Promise<Post> {
    const { data: post, error } = await this.supabase
      .from("Post")
      .insert({
        id: uuidv4(),
        user_id: fakeUserId,
        community_id: fakeCommunityId,
        title: data.title,
        content: data.content,
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
      .from("Post")
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
      .from("Post")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    return posts || [];
  }

  async findByUserId(userId: string): Promise<Post[]> {
    const { data: posts, error } = await this.supabase
      .from("Post")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by user: ${error.message}`);
    }

    return posts || [];
  }

  async update(id: string, data: UpdatePostDTO): Promise<Post> {
    const { data: post, error } = await this.supabase
      .from("Post")
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
    const { error } = await this.supabase.from("Post").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }
}
