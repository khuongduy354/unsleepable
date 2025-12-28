"use client";

import { useState, useCallback } from "react";
import { Post } from "@/lib/types/post.type";
import { PostSearchResult } from "@/lib/types/search.type";
import PostList from "./PostList";
import SearchBar from "./SearchBar";

interface PostsClientProps {
  initialPosts: Post[];
}

export default function PostsClient({ initialPosts }: PostsClientProps) {
  const [displayPosts, setDisplayPosts] = useState<Post[]>(initialPosts);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = useCallback((results: PostSearchResult[]) => {
    // Convert search results to Post format (they have the same fields)
    const posts = results.map((result) => ({
      id: result.id,
      title: result.title,
      content: result.content,
      user_id: result.user_id,
      community_id: result.community_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      likes_count: result.likes_count,
      dislikes_count: result.dislikes_count,
      comments_count: result.comments_count,
      engagement_score: result.engagement_score,
      community_name: result.community_name,
      author_name: result.username,
      status: "approved" as const,
    }));
    setDisplayPosts(posts);
    setIsSearching(true);
  }, []);

  const handleSearchClear = useCallback(() => {
    setDisplayPosts(initialPosts);
    setIsSearching(false);
  }, [initialPosts]);

  return (
    <>
      <SearchBar
        onSearchResults={handleSearchResults}
        onSearchClear={handleSearchClear}
      />
      {isSearching && displayPosts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No posts found matching your search.
        </div>
      ) : (
        <PostList posts={displayPosts} />
      )}
    </>
  );
}
