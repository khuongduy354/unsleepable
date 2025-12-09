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
  const [orTags, setOrTags] = useState("");
  const [andTags, setAndTags] = useState("");
  const [notTags, setNotTags] = useState("");
  const [showTagFilters, setShowTagFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Unified search function
  const performSearch = useCallback(
    async (query: string, orTagsStr: string, andTagsStr: string, notTagsStr: string) => {
      if (!query.trim()) {
        onSearchClear();
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams({ q: query });
        
        if (orTagsStr.trim()) {
          params.append("orTags", orTagsStr);
        }
        if (andTagsStr.trim()) {
          params.append("andTags", andTagsStr);
        }
        if (notTagsStr.trim()) {
          params.append("notTags", notTagsStr);
        }
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
      performSearch(searchQuery, orTags, andTags, notTags);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, orTags, andTags, notTags, performSearch]);

  const handleClear = () => {
    setSearchQuery("");
    setOrTags("");
    setAndTags("");
    setNotTags("");
    onSearchClear();
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Main search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts by keyword..."
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Tag filters toggle */}
      <button
        onClick={() => setShowTagFilters(!showTagFilters)}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        {showTagFilters ? '▼' : '▶'} Filter by tags (optional)
      </button>

      {/* Tag filters section */}
      {showTagFilters && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* OR tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Has any of these tags:
            </label>
            <input
              type="text"
              value={orTags}
              onChange={(e) => setOrTags(e.target.value)}
              placeholder="e.g., react, vue, angular"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Posts with at least one of these tags</p>
          </div>

          {/* AND tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Must have all of these tags:
            </label>
            <input
              type="text"
              value={andTags}
              onChange={(e) => setAndTags(e.target.value)}
              placeholder="e.g., javascript, tutorial"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Posts must have every tag listed</p>
          </div>

          {/* NOT tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exclude these tags:
            </label>
            <input
              type="text"
              value={notTags}
              onChange={(e) => setNotTags(e.target.value)}
              placeholder="e.g., beginner, deprecated"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Posts must not have any of these tags</p>
          </div>

          {/* Clear filters */}
          {(orTags || andTags || notTags) && (
            <button
              onClick={() => {
                setOrTags("");
                setAndTags("");
                setNotTags("");
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear all tag filters
            </button>
          )}
        </div>
      )}

      {isSearching && (
        <div className="text-sm text-gray-500">Searching...</div>
      )}
    </div>
  );
}
