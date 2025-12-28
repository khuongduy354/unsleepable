import { SupabaseClient } from "@supabase/supabase-js";
import { IUserRepository, User, UpdateUserProfileDTO } from "../../types/user.type";

export class SupabaseUserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("User")
      .select("id, email, username, created_at, status")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to get user by id: ${error.message}`);
    }

    return data as User;
  }

  async getByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("User")
      .select("id, email, username, created_at, status")
      .eq("username", username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user by username: ${error.message}`);
    }

    return data as User;
  }

  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("User")
      .select("id, email, username, created_at, status")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user by email: ${error.message}`);
    }

    return data as User;
  }

  async updateProfile(userId: string, data: UpdateUserProfileDTO): Promise<User> {
    const updateData: any = {};
    
    if (data.username !== undefined) {
      updateData.username = data.username;
    }
    
    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    const { data: user, error } = await this.supabase
      .from("User")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, username, created_at, status")
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return user as User;
  }

  async updateStatus(userId: string, status: string): Promise<User> {
    const { data: user, error } = await this.supabase
      .from("User")
      .update({ status })
      .eq("id", userId)
      .select("id, email, username, created_at, status")
      .single();

    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }

    return user as User;
  }
}
