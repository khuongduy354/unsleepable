import {
  // getPostService as originalGetPostService,
  getCommunityService as originalGetCommunityService,
} from "./production-setup";

class Service {
  // async getPostService() {
  //   return await originalGetPostService();
  // }

  async getCommunityService() {
    return await originalGetCommunityService();
  }
}

export const service = new Service();
