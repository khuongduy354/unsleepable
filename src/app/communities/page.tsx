"use client";

import { useState, useEffect } from "react";
import { communityApi } from "@/lib/api";

interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
}

interface PaginatedResponse {
  communities: Community[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [ownedCommunities, setOwnedCommunities] = useState<Community[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState("d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public" as "public" | "private",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all communities
  const fetchCommunities = async (page: number = 1) => {
    try {
      const data = await communityApi.getAll(page, 5);
      setCommunities(data.communities);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch communities"
      );
    }
  };

  // Fetch owned communities
  const fetchOwnedCommunities = async () => {
    if (!userId) return;

    try {
      const data = await communityApi.getOwned(userId);
      setOwnedCommunities(data.communities);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch owned communities"
      );
    }
  };

  useEffect(() => {
    fetchCommunities(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (userId) {
      fetchOwnedCommunities();
    }
  }, [userId]);

  // Create community
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Please enter a user ID first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await communityApi.create(userId, formData);

      // Reset form and refresh data
      setFormData({ name: "", description: "", visibility: "public" });
      setShowCreateForm(false);
      await fetchCommunities(currentPage);
      await fetchOwnedCommunities();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create community"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update community
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommunity || !userId) return;

    setLoading(true);
    setError("");

    try {
      await communityApi.update(editingCommunity.id, userId, formData);

      // Reset form and refresh data
      setFormData({ name: "", description: "", visibility: "public" });
      setEditingCommunity(null);
      await fetchCommunities(currentPage);
      await fetchOwnedCommunities();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update community"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete community
  const handleDelete = async (communityId: string) => {
    if (!userId) {
      setError("Please enter a user ID first");
      return;
    }

    if (!confirm("Are you sure you want to delete this community?")) return;

    setLoading(true);
    setError("");

    try {
      await communityApi.delete(communityId, userId);

      await fetchCommunities(currentPage);
      await fetchOwnedCommunities();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete community"
      );
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (community: Community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      description: community.description || "",
      visibility: community.visibility as "public" | "private",
    });
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Communities</h1>

        {/* User ID Input (Mock Auth) */}
        <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <label className="block mb-2 font-semibold">
            Mock User ID (for testing):
          </label>
          <input
            type="text"
            value={userId}
            // defaultValue={"d2f1d6c0-47b4-4e3d-9ce4-5cb9033e1234"}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter a user ID"
            className="w-full p-2 border rounded"
          />
          <p className="text-sm mt-2 text-gray-600">
            This simulates authentication. Use a real user ID from your
            database.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingCommunity) && (
          <div className="mb-8 p-6 bg-white border rounded shadow">
            <h2 className="text-2xl font-bold mb-4">
              {editingCommunity ? "Edit Community" : "Create Community"}
            </h2>
            <form onSubmit={editingCommunity ? handleUpdate : handleCreate}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibility: e.target.value as "public" | "private",
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading
                    ? "Saving..."
                    : editingCommunity
                    ? "Update"
                    : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCommunity(null);
                    setFormData({
                      name: "",
                      description: "",
                      visibility: "public",
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Button */}
        {!showCreateForm && !editingCommunity && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Create Community
          </button>
        )}

        {/* Owned Communities */}
        {userId && ownedCommunities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Communities</h2>
            <div className="grid gap-4">
              {ownedCommunities.map((community) => (
                <div
                  key={community.id}
                  className="p-4 bg-green-50 border border-green-200 rounded shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{community.name}</h3>
                      <p className="text-gray-600 mt-2">
                        {community.description || "No description"}
                      </p>
                      <div className="mt-2 flex gap-4 text-sm text-gray-500">
                        <span className="capitalize">
                          {community.visibility}
                        </span>
                        <span>
                          {new Date(community.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(community)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(community.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Communities */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Communities</h2>
          {communities.length === 0 ? (
            <p className="text-gray-500">No communities found.</p>
          ) : (
            <>
              <div className="grid gap-4 mb-4">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    className="p-4 bg-white border rounded shadow"
                  >
                    <h3 className="text-xl font-bold">{community.name}</h3>
                    <p className="text-gray-600 mt-2">
                      {community.description || "No description"}
                    </p>
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      <span className="capitalize">{community.visibility}</span>
                      <span>
                        {new Date(community.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
