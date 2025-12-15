import { SupabaseClient } from "@supabase/supabase-js";
// import {
//   CreatePostDTO,
//   UpdatePostDTO,
//   Post,
//   IPostRepository,
// } from "../../types/post.type";
import {
  CreateCommunityDTO,
  UpdateCommunityDTO,
  Community,
  ICommunityRepository,
  CommunityFilters,
  PaginatedCommunities,
  CommunityStatsDTO,
} from "../../types/community.type";

// export class SupabasePostRepository implements IPostRepository {
//   constructor(private supabase: SupabaseClient) {}

//   async create(data: CreatePostDTO): Promise<Post> {
//     const { data: post, error } = await this.supabase
//       .from("posts")
//       .insert({
//         title: data.title,
//         content: data.content,
//         author_id: data.author_id,
//       })
//       .select()
//       .single();

//     if (error) {
//       throw new Error(`Failed to create post: ${error.message}`);
//     }

//     return post;
//   }

//   async findById(id: string): Promise<Post | null> {
//     const { data: post, error } = await this.supabase
//       .from("posts")
//       .select("*")
//       .eq("id", id)
//       .single();

//     if (error) {
//       if (error.code === "PGRST116") {
//         return null;
//       }
//       throw new Error(`Failed to find post: ${error.message}`);
//     }

//     return post;
//   }

//   async findAll(): Promise<Post[]> {
//     const { data: posts, error } = await this.supabase
//       .from("posts")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) {
//       throw new Error(`Failed to fetch posts: ${error.message}`);
//     }

//     return posts || [];
//   }

//   async findByAuthorId(authorId: string): Promise<Post[]> {
//     const { data: posts, error } = await this.supabase
//       .from("posts")
//       .select("*")
//       .eq("author_id", authorId)
//       .order("created_at", { ascending: false });

//     if (error) {
//       throw new Error(`Failed to fetch posts by author: ${error.message}`);
//     }

//     return posts || [];
//   }

//   async update(id: string, data: UpdatePostDTO): Promise<Post> {
//     const { data: post, error } = await this.supabase
//       .from("posts")
//       .update({
//         ...data,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", id)
//       .select()
//       .single();

//     if (error) {
//       throw new Error(`Failed to update post: ${error.message}`);
//     }

//     return post;
//   }

//   async delete(id: string): Promise<void> {
//     const { error } = await this.supabase.from("posts").delete().eq("id", id);

//     if (error) {
//       throw new Error(`Failed to delete post: ${error.message}`);
//     }
//   }
// }

export class SupabaseCommunityRepository implements ICommunityRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateCommunityDTO): Promise<Community> {
    // Start a transaction: create community and add creator as admin member
    const { data: community, error: communityError } = await this.supabase
      .from("Community")
      .insert({
        name: data.name,
        description: data.description || null,
        visibility: data.visibility || "public",
        tags: data.tags,
      })
      .select()
      .single();

    if (communityError) {
      throw new Error(`Failed to create community: ${communityError.message}`);
    }

    // Add creator as admin member
    const { error: memberError } = await this.supabase
      .from("CommunityMember")
      .insert({
        user_account_id: data.creator_id,
        community_id: community.id,
        role: "admin",
      });

    if (memberError) {
      // Rollback: delete the community
      await this.supabase.from("Community").delete().eq("id", community.id);
      throw new Error(
        `Failed to add creator as member: ${memberError.message}`
      );
    }

    return community;
  }

  async findById(id: string): Promise<Community | null> {
    const { data: community, error } = await this.supabase
      .from("Community")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to find community: ${error.message}`);
    }

    return community;
  }

  async findAll(filters?: CommunityFilters): Promise<PaginatedCommunities> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let query = this.supabase.from("Community").select("*", { count: "exact" });

    // Apply visibility filter if provided
    if (filters?.visibility) {
      query = query.eq("visibility", filters.visibility);
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: communities, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch communities: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      communities: communities || [],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findByOwnerId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedCommunities> {
    const offset = (page - 1) * limit;

    // First, get the community IDs where user is admin
    const { data: memberData, error: memberError } = await this.supabase
      .from("CommunityMember")
      .select("community_id")
      .eq("user_account_id", userId)
      .eq("role", "admin");

    if (memberError) {
      throw new Error(
        `Failed to fetch owned communities: ${memberError.message}`
      );
    }

    if (!memberData || memberData.length === 0) {
      return {
        communities: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const communityIds = memberData.map((m) => m.community_id);

    // Now fetch the actual communities
    const {
      data: communities,
      error,
      count,
    } = await this.supabase
      .from("Community")
      .select("*", { count: "exact" })
      .in("id", communityIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch owned communities: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      communities: communities || [],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(id: string, data: UpdateCommunityDTO): Promise<Community> {
    const { data: community, error } = await this.supabase
      .from("Community")
      .update({
        ...data,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update community: ${error.message}`);
    }

    return community;
  }

  async delete(id: string): Promise<void> {
    // Delete community members first (cascade should handle this, but being explicit)
    await this.supabase.from("CommunityMember").delete().eq("community_id", id);

    // Delete community
    const { error } = await this.supabase
      .from("Community")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete community: ${error.message}`);
    }
  }

  async isOwner(communityId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("CommunityMember")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_account_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return false; // No membership found
      }
      throw new Error(`Failed to check ownership: ${error.message}`);
    }

    return data?.role === "admin";
  }
  async addTagToCommunityArray(
    communityId: string,
    tagName: string
  ): Promise<void> {
    const { data: community, error: fetchError } = await this.supabase
      .from("Community")
      .select("tags")
      .eq("id", communityId)
      .single();
    if (fetchError || !community)
      throw new Error("Community not found or fetch failed.");

    const currentTags: string[] = community.tags || [];

    if (
      currentTags.map((t) => t.toLowerCase()).includes(tagName.toLowerCase())
    ) {
      return;
    }

    // Thêm tag mới vào mảng
    const updatedTags = [...currentTags, tagName];

    const { error: updateError } = await this.supabase
      .from("Community")
      .update({ tags: updatedTags })
      .eq("id", communityId);

    if (updateError)
      throw new Error(
        `Failed to sync tag to community array: ${updateError.message}`
      );
  }
  async getCommunityStats(communityId: string): Promise<CommunityStatsDTO> {
    // count total member
    const { count: memberCount, error: memberError } = await this.supabase
      .from("CommunityMember")
      .select("user_account_id", { count: "exact", head: true })
      .eq("community_id", communityId);

    if (memberError) {
      throw new Error(`Failed to count members: ${memberError.message}`);
    }

    // count total posts
    const { count: postCount, error: postError } = await this.supabase
      .from("Post")
      .select("id", { count: "exact", head: true })
      .eq("community_id", communityId);

    if (postError) {
      throw new Error(`Failed to count posts: ${postError.message}`);
    }

    const totalPosts = postCount || 0;

    // count active percentage
    const { data: activePostsResult, error: activePostError } =
      await this.supabase.rpc("count_active_posts_for_community", {
        community_id_param: communityId,
      });

    if (activePostError) {
      throw new Error(
        `Failed to count active posts via RPC: ${activePostError.message}`
      );
    }

    const activePostCount =
      activePostsResult && activePostsResult.length > 0
        ? activePostsResult[0].active_post_count
        : 0;

    let activeEngagementRate = 0;
    if (totalPosts > 0) {
      // Tỷ lệ = (Số Posts hoạt động) / (Tổng số Posts)
      activeEngagementRate = activePostCount / totalPosts;
    }

    return {
      communityId: communityId,
      totalPosts: totalPosts,
      totalMembers: memberCount || 0,
      activeEngagementRate: activeEngagementRate,
    };
  }
}
