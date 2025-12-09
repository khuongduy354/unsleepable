import {
  // getPostService as originalGetPostService,
  getCommunityService as originalGetCommunityService,
  getNotificationService as originalGetNotificationService,
} from "./production-setup";

class Service {
  // async getPostService() {
  //   return await originalGetPostService();
  // }

  async getCommunityService() {
    return await originalGetCommunityService();
  }

  async getNotificationService() {
    return await originalGetNotificationService();
  }
}

export const service = new Service();
