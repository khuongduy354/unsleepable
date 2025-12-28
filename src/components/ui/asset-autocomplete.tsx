"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Asset } from "@/lib/types/asset.type";
import { assetApi } from "@/lib/api";
import { Loader2, File } from "lucide-react";

interface AssetAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AssetAutocomplete({
  value,
  onChange,
  onPaste,
  placeholder,
  className = "",
  disabled = false,
}: AssetAutocompleteProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [suggestions, setSuggestions] = useState<Asset[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load user's assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const response = await assetApi.getAll();
        setAssets(response.files || []);
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setLoadingAssets(false);
      }
    };
    loadAssets();
  }, []);

  // Detect @ mentions and show suggestions
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    // Check if we're in an @ mention context
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      // Only show suggestions if there's no space after @
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        const searchTerm = textAfterAt.toLowerCase();

        const filtered = assets.filter((asset) =>
          asset.filename.toLowerCase().includes(searchTerm)
        );

        if (filtered.length > 0) {
          setSuggestions(filtered.slice(0, 5));
          setShowSuggestions(true);
          setSelectedIndex(0);
          return;
        }
      }
    }

    setShowSuggestions(false);
    setSuggestions([]);
  }, [value, cursorPosition, assets]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? suggestions.length - 1 : prev - 1
        );
        break;
      case "Enter":
      case "Tab":
        if (showSuggestions) {
          e.preventDefault();
          insertAsset(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Insert selected asset into text
  const insertAsset = (asset: Asset) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    // Determine if asset is an image
    const isImage = asset.type?.toLowerCase().startsWith("image/");

    // Replace from @ to cursor with the asset reference
    // Use ![]() syntax for images, []() for other files
    const assetMarkdown = isImage
      ? `![${asset.filename}](${asset.url})`
      : `[${asset.filename}](${asset.url})`;

    const newValue =
      textBeforeCursor.substring(0, lastAtIndex) +
      assetMarkdown +
      textAfterCursor;

    onChange(newValue);
    setShowSuggestions(false);

    // Move cursor after the inserted text
    setTimeout(() => {
      const newPosition = lastAtIndex + assetMarkdown.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        onClick={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
        onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-h-50 resize-y ${className}`}
        rows={8}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b">
            Press ↑↓ to navigate, Enter/Tab to select, Esc to dismiss
          </div>
          {suggestions.map((asset, index) => (
            <button
              key={asset.id}
              onClick={() => insertAsset(asset)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                index === selectedIndex ? "bg-gray-100 dark:bg-gray-700" : ""
              }`}
            >
              <File className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{asset.filename}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {asset.type} • {(asset.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {loadingAssets && (
        <div className="absolute top-2 right-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Type @ to reference your uploaded files
      </div>
    </div>
  );
}
