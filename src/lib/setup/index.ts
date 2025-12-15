import {
  getPostService as originalGetPostService,
  getCommunityService as originalGetCommunityService,
  getNotificationService as originalGetNotificationService,
  getTagService as originalGetTagService,
  getMessageService as originalGetMessageService
} from "./production-setup";

class Service {
  async getPostService() {
    return await originalGetPostService();
  }

  async getCommunityService() {
    return await originalGetCommunityService();
  }

  async getNotificationService() {
    return await originalGetNotificationService(); 
  }
  async getTagService() {
    return await originalGetTagService();
  }
  
  async getMessageService() {
    return await originalGetMessageService();
  }
}

export const service = new Service();
