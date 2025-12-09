import {
  // getPostService as originalGetTagService,
  getTagService as originalGetTagService,
} from "./production-setup";

class Service {
  async getTagService() {
    return await originalGetTagService();
  }
}

export const service = new Service();
