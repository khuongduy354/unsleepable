// User types and interfaces

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  status: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  status: string;
}

export interface UpdateUserProfileDTO {
  username?: string;
  email?: string;
}

export interface IUserRepository {
  getById(userId: string): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  updateProfile(userId: string, data: UpdateUserProfileDTO): Promise<User>;
  updateStatus(userId: string, status: string): Promise<User>;
}

export interface IUserService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: UpdateUserProfileDTO): Promise<UserProfile>;
  getUserByUsername(username: string): Promise<UserProfile | null>;
  checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean>;
  checkEmailAvailability(email: string, excludeUserId?: string): Promise<boolean>;
}
