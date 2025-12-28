// API callers for user endpoints

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  status: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
}

export const userApi = {
  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    const response = await fetch("/api/user/profile");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Failed to fetch profile");
    }

    return await response.json();
  },

  // Update current user profile
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Failed to update profile");
    }

    return await response.json();
  },

  // Get user by username
  async getUserByUsername(username: string): Promise<Partial<UserProfile>> {
    const response = await fetch(`/api/user/${username}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Failed to fetch user");
    }

    return await response.json();
  },

  // Check username availability
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const response = await fetch(
      `/api/user/check?username=${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      throw new Error("Failed to check username availability");
    }

    const data = await response.json();
    return data.available;
  },

  // Check email availability
  async checkEmailAvailability(email: string): Promise<boolean> {
    const response = await fetch(
      `/api/user/check?email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      throw new Error("Failed to check email availability");
    }

    const data = await response.json();
    return data.available;
  },
};
