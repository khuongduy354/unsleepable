import { 
  IUserService, 
  IUserRepository, 
  UserProfile,
  UpdateUserProfileDTO
} from "../types/user.type";

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async getProfile(userId: string): Promise<UserProfile> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await this.userRepository.getById(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at,
      status: user.status,
    };
  }

  async updateProfile(userId: string, data: UpdateUserProfileDTO): Promise<UserProfile> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate username if provided
    if (data.username !== undefined) {
      if (!data.username || data.username.trim().length === 0) {
        throw new Error("Username cannot be empty");
      }

      if (data.username.length < 3) {
        throw new Error("Username must be at least 3 characters long");
      }

      if (data.username.length > 30) {
        throw new Error("Username must not exceed 30 characters");
      }

      // Check if username is available
      const isAvailable = await this.checkUsernameAvailability(data.username, userId);
      if (!isAvailable) {
        throw new Error("Username is already taken");
      }
    }

    // Validate email if provided
    if (data.email !== undefined) {
      if (!data.email || data.email.trim().length === 0) {
        throw new Error("Email cannot be empty");
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("Invalid email format");
      }

      // Check if email is available
      const isAvailable = await this.checkEmailAvailability(data.email, userId);
      if (!isAvailable) {
        throw new Error("Email is already taken");
      }
    }

    const updatedUser = await this.userRepository.updateProfile(userId, data);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      created_at: updatedUser.created_at,
      status: updatedUser.status,
    };
  }

  async getUserByUsername(username: string): Promise<UserProfile | null> {
    if (!username) {
      throw new Error("Username is required");
    }

    const user = await this.userRepository.getByUsername(username);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at,
      status: user.status,
    };
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
    const existingUser = await this.userRepository.getByUsername(username);
    
    if (!existingUser) {
      return true;
    }

    // If excludeUserId is provided, check if it's the same user
    if (excludeUserId && existingUser.id === excludeUserId) {
      return true;
    }

    return false;
  }

  async checkEmailAvailability(email: string, excludeUserId?: string): Promise<boolean> {
    const existingUser = await this.userRepository.getByEmail(email);
    
    if (!existingUser) {
      return true;
    }

    // If excludeUserId is provided, check if it's the same user
    if (excludeUserId && existingUser.id === excludeUserId) {
      return true;
    }

    return false;
  }
}
