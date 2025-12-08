import {
  ISearchService,
  ISearchRepository,
  SearchPostsDTO,
  PostSearchResult,
} from "../types/search.type";

export class SearchService implements ISearchService {
  constructor(private searchRepository: ISearchRepository) {}

  async searchPosts(params: SearchPostsDTO): Promise<PostSearchResult[]> {
    // Validate query
    if (!params.query || params.query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    // Limit validation
    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      throw new Error("Limit must be between 1 and 100");
    }

    // Offset validation
    if (params.offset && params.offset < 0) {
      throw new Error("Offset must be non-negative");
    }

    return await this.searchRepository.searchPosts(params);
  }
}
