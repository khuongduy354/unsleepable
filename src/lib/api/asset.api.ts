// Asset API client
import { Asset, AssetListResponse } from "../types/asset.type";

const API_BASE = "/api/storage";

export const assetApi = {
  /**
   * Get all assets for the current user
   */
  async getAll(): Promise<AssetListResponse> {
    const response = await fetch(API_BASE, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch assets");
    }

    return response.json();
  },

  /**
   * Delete an asset
   */
  async delete(assetId: string): Promise<void> {
    const response = await fetch(`${API_BASE}?id=${assetId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete asset");
    }
  },
};
