"use client";

import { useState, useEffect, useCallback } from "react";
import { PostSearchResult } from "@/lib/types/search.type";

interface SearchBarProps {
  onSearchResults: (results: PostSearchResult[]) => void;
  onSearchClear: () => void;
  communityId?: string;
}

export default function SearchBar({
  onSearchResults,
  onSearchClear,
  communityId,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        onSearchClear();
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (communityId) {
          params.append("communityId", communityId);
        }

        const response = await fetch(`/api/search?${params.toString()}`);
        if (response.ok) {
          const results = await response.json();
          onSearchResults(results);
        } else {
          console.error("Search failed:", await response.text());
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [communityId, onSearchResults, onSearchClear]
  );

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleClear = () => {
    setSearchQuery("");
    onSearchClear();
  };

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts by title..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      {isSearching && (
        <div className="text-sm text-gray-500 mt-2">Searching...</div>
      )}
    </div>
  );
}
