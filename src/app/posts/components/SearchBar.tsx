"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostSearchResult } from "@/lib/types/search.type";
import { searchApi, communityApi, tagApi } from "@/lib/api";

interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
}

interface Tag {
  id: string;
  Name: string;
}

interface SearchBarProps {
  onSearchResults: (
    results: PostSearchResult[],
    hasMore: boolean,
    searchParams?: {
      query: string;
      orTags?: string;
      andTags?: string;
      notTags?: string;
      communityId?: string;
      sortBy: "relevance" | "time";
    }
  ) => void;
  onSearchClear: () => void;
  communityId?: string;
  onLoadMore?: () => void;
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
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "time">("relevance");

  // Tag suggestions state
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [activeTagField, setActiveTagField] = useState<
    "or" | "and" | "not" | null
  >(null);
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load public communities for filter dropdown
  useEffect(() => {
    const loadCommunities = async () => {
      setLoadingCommunities(true);
      try {
        const response = await communityApi.getAll(1, 100, "public");
        setCommunities(response.communities);
      } catch (error) {
        console.error("Failed to load communities:", error);
      } finally {
        setLoadingCommunities(false);
      }
    };
    loadCommunities();
  }, []);

  // Load tags based on selected community (or all tags if none selected)
  useEffect(() => {
    const loadTags = async () => {
      setLoadingTags(true);
      try {
        const effectiveCommunityId = selectedCommunityId || communityId;
        const response = effectiveCommunityId
          ? await tagApi.getByCommunity(effectiveCommunityId)
          : await tagApi.getAll();
        setAvailableTags(response.tags);
      } catch (error) {
        console.error("Failed to load tags:", error);
      } finally {
        setLoadingTags(false);
      }
    };
    loadTags();
  }, [selectedCommunityId, communityId]);

  // Filter suggestions based on current input
  const filterTagSuggestions = useCallback(
    (input: string, currentTags: string) => {
      const currentTagList = currentTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      // Check if user is typing with # prefix
      const lastTag = input.split(",").pop()?.trim() || "";
      const searchTerm = lastTag.startsWith("#")
        ? lastTag.substring(1).toLowerCase()
        : lastTag.toLowerCase();

      // Show all tags if user just typed # with no characters after
      if (lastTag === "#") {
        setTagSuggestions(
          availableTags
            .filter((tag) => {
              const tagName = tag.Name.toLowerCase();
              return (
                !currentTagList.includes(tagName) &&
                !currentTagList.includes(`#${tagName}`)
              );
            })
            .slice(0, 10)
        );
        return;
      }

      if (!searchTerm) {
        setTagSuggestions([]);
        return;
      }

      const filtered = availableTags.filter((tag) => {
        const tagName = tag.Name.toLowerCase();
        // Don't suggest tags that are already added (with or without #)
        if (
          currentTagList.includes(tagName) ||
          currentTagList.includes(`#${tagName}`)
        )
          return false;
        // Match tags that start with the current input
        return tagName.startsWith(searchTerm);
      });

      setTagSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    },
    [availableTags]
  );

  // Handle tag input changes with suggestions
  const handleTagInputChange = (
    value: string,
    setter: (val: string) => void,
    field: "or" | "and" | "not"
  ) => {
    setter(value);
    setActiveTagField(field);
    filterTagSuggestions(value, value);
  };

  // Handle selecting a suggestion
  const selectTagSuggestion = (
    tag: Tag,
    currentValue: string,
    setter: (val: string) => void
  ) => {
    const parts = currentValue.split(",");
    parts.pop(); // Remove the partial tag being typed
    parts.push(`#${tag.Name}`); // Add # prefix to the tag
    setter(parts.join(", ").replace(/^, /, "")); // Join and clean up
    setTagSuggestions([]);
    setActiveTagField(null);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setTagSuggestions([]);
        setActiveTagField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Unified search function
  const performSearch = useCallback(
    async (
      query: string,
      orTagsStr: string,
      andTagsStr: string,
      notTagsStr: string,
      commId: string,
      sort: "relevance" | "time" = "relevance"
    ) => {
      // if (!query.trim()) {
      //   onSearchClear();
      //   return;
      // }

      setIsSearching(true);
      try {
        const PAGE_SIZE = 20;
        const effectiveCommunityId = commId || communityId;
        const results = await searchApi.searchPosts({
          query,
          orTags: orTagsStr,
          andTags: andTagsStr,
          notTags: notTagsStr,
          communityId: effectiveCommunityId,
          limit: PAGE_SIZE,
          offset: 0,
          sortBy: sort,
        });
        const hasMore = results.length === PAGE_SIZE;
        onSearchResults(results, hasMore, {
          query,
          orTags: orTagsStr || undefined,
          andTags: andTagsStr || undefined,
          notTags: notTagsStr || undefined,
          communityId: effectiveCommunityId || undefined,
          sortBy: sort,
        });
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
      performSearch(
        searchQuery,
        orTags,
        andTags,
        notTags,
        selectedCommunityId,
        sortBy
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    orTags,
    andTags,
    notTags,
    selectedCommunityId,
    sortBy,
    performSearch,
  ]);

  const handleClear = () => {
    setSearchQuery("");
    setOrTags("");
    setAndTags("");
    setNotTags("");
    setSelectedCommunityId("");
    setSortBy("relevance");
    onSearchClear();
  };

  // Manual search trigger
  const handleManualSearch = () => {
    console.log("Manual search triggered");
    performSearch(
      searchQuery,
      orTags,
      andTags,
      notTags,
      selectedCommunityId,
      sortBy
    );
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Main search input with search button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
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
        <button
          onClick={handleManualSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Search
        </button>
      </div>

      {/* Sort by selector */}
      {/* <div className="flex items-center gap-2"> */}
      {/* <label className="text-sm font-medium text-gray-700">Sort by:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("relevance")}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              sortBy === "relevance"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Relevance
          </button>
          <button
            onClick={() => setSortBy("time")}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              sortBy === "time"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Newest First
          </button>
        </div>
      </div> */}

      {/* Community filter dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          Filter by community:
        </label>
        <select
          value={selectedCommunityId}
          onChange={(e) => setSelectedCommunityId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loadingCommunities}
        >
          <option value="">All Communities</option>
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tag filters toggle */}
      <button
        onClick={() => setShowTagFilters(!showTagFilters)}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        {showTagFilters ? "▼" : "▶"} Filter by tags (optional)
      </button>

      {/* Tag filters section */}
      {showTagFilters && (
        <div
          className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
          ref={suggestionsRef}
        >
          {loadingTags && (
            <p className="text-xs text-gray-500">Loading tag suggestions...</p>
          )}

          {/* OR tags */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Has any of these tags:
            </label>
            <input
              type="text"
              value={orTags}
              onChange={(e) =>
                handleTagInputChange(e.target.value, setOrTags, "or")
              }
              onFocus={() => {
                setActiveTagField("or");
                filterTagSuggestions(orTags, orTags);
              }}
              placeholder="Type # to browse tags, e.g., #react, #vue"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {activeTagField === "or" && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  Available tags
                </div>
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => selectTagSuggestion(tag, orTags, setOrTags)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:bg-blue-50 dark:focus:bg-blue-900 flex items-center gap-2"
                  >
                    <span className="text-blue-600 dark:text-blue-400">#</span>
                    <span>{tag.Name}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Posts with at least one of these tags (separate with commas)
            </p>
          </div>

          {/* AND tags */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Must have all of these tags:
            </label>
            <input
              type="text"
              value={andTags}
              onChange={(e) =>
                handleTagInputChange(e.target.value, setAndTags, "and")
              }
              onFocus={() => {
                setActiveTagField("and");
                filterTagSuggestions(andTags, andTags);
              }}
              placeholder="Type # to browse tags, e.g., #javascript, #tutorial"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {activeTagField === "and" && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  Available tags
                </div>
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      selectTagSuggestion(tag, andTags, setAndTags)
                    }
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:bg-blue-50 dark:focus:bg-blue-900 flex items-center gap-2"
                  >
                    <span className="text-blue-600 dark:text-blue-400">#</span>
                    <span>{tag.Name}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Posts must have every tag listed (separate with commas)
            </p>
          </div>

          {/* NOT tags */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exclude these tags:
            </label>
            <input
              type="text"
              value={notTags}
              onChange={(e) =>
                handleTagInputChange(e.target.value, setNotTags, "not")
              }
              onFocus={() => {
                setActiveTagField("not");
                filterTagSuggestions(notTags, notTags);
              }}
              placeholder="Type # to browse tags, e.g., #beginner, #deprecated"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {activeTagField === "not" && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  Available tags
                </div>
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      selectTagSuggestion(tag, notTags, setNotTags)
                    }
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:bg-blue-50 dark:focus:bg-blue-900 flex items-center gap-2"
                  >
                    <span className="text-blue-600 dark:text-blue-400">#</span>
                    <span>{tag.Name}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Posts must not have any of these tags (separate with commas)
            </p>
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

      {isSearching && <div className="text-sm text-gray-500">Searching...</div>}
    </div>
  );
}
