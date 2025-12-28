// Asset type definitions
export interface Asset {
  id: string;
  filename: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
  user_id: string;
}

export interface AssetListResponse {
  files: Asset[];
  totalSize: number;
}
