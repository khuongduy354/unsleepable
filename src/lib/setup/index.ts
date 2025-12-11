import {
  getPostService as originalGetPostService,
  getCommunityService as originalGetCommunityService,
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

  async getTagService() {
    return await originalGetTagService();
  }
  
  async getMessageService() {
    return await originalGetMessageService();
  }
}

export const service = new Service();
