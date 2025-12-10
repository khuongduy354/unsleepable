import {
  getPostService as originalGetPostService,
  getCommunityService as originalGetCommunityService,
  getReportService as originalGetReportService,
} from "./production-setup";

class Service {
  async getPostService() {
    return await originalGetPostService();
  }

  async getCommunityService() {
    return await originalGetCommunityService();
  }

  async getReportService() {
    return await originalGetReportService();
  }
}

export const service = new Service();
