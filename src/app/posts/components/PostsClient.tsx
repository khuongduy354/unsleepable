"use client";

import { useState, useCallback, useRef } from "react";
import { Post } from "@/lib/types/post.type";
import { PostSearchResult } from "@/lib/types/search.type";
import PostList from "./PostList";
import SearchBar from "./SearchBar";
import { searchApi } from "@/lib/api";

interface PostsClientProps {
  initialPosts: Post[];
}

// Helper to convert search results to Post format
const convertSearchResultsToPosts = (results: PostSearchResult[]): Post[] => {
  return results.map((result) => ({
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
};

export default function PostsClient({ initialPosts }: PostsClientProps) {
  const [displayPosts, setDisplayPosts] = useState<Post[]>(initialPosts);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Store current search params for "load more"
  const searchParamsRef = useRef<{
    query: string;
    orTags?: string;
    andTags?: string;
    notTags?: string;
    communityId?: string;
    sortBy: "relevance" | "time";
    offset: number;
  }>({
    query: "",
    sortBy: "relevance",
    offset: 0,
  });

  const handleSearchClear = useCallback(() => {
    setDisplayPosts(initialPosts);
    setIsSearching(false);
    setHasMore(true);
    searchParamsRef.current = {
      query: "",
      sortBy: "relevance",
      offset: 0,
    };
  }, [initialPosts]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const PAGE_SIZE = 20;
      const params = searchParamsRef.current;

      const results = await searchApi.searchPosts({
        query: params.query,
        orTags: params.orTags,
        andTags: params.andTags,
        notTags: params.notTags,
        communityId: params.communityId,
        limit: PAGE_SIZE,
        offset: params.offset,
        sortBy: params.sortBy,
      });

      const posts = convertSearchResultsToPosts(results);
      setDisplayPosts((prev) => [...prev, ...posts]);

      // Update offset for next load
      searchParamsRef.current.offset += results.length;
      setHasMore(results.length === PAGE_SIZE);
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  // Update search params when SearchBar performs a search
  const handleSearchWithParams = useCallback(
    (
      results: PostSearchResult[],
      hasMoreResults: boolean,
      params?: {
        query: string;
        orTags?: string;
        andTags?: string;
        notTags?: string;
        communityId?: string;
        sortBy: "relevance" | "time";
      }
    ) => {
      const posts = convertSearchResultsToPosts(results);
      setDisplayPosts(posts);
      setHasMore(hasMoreResults);
      setIsSearching(true);

      if (params) {
        searchParamsRef.current = {
          ...params,
          offset: results.length,
        };
      }
    },
    []
  );

  return (
    <>
      <SearchBar
        onSearchResults={handleSearchWithParams}
        onSearchClear={handleSearchClear}
      />
      {isSearching && displayPosts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No posts found matching your search.
        </div>
      ) : (
        <>
          <PostList posts={displayPosts} />
          {hasMore && isSearching && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
