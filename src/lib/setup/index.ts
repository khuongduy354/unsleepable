import { getPostService as originalGetPostService } from "./production-setup";

class Service {
  async getPostService() {
    return await originalGetPostService();
  }
}

export const service = new Service();
