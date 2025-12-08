import { getPostService } from "@/lib/setup/production-setup";
import PostsClient from "./components/PostsClient";

export default async function PostsPage() {
  const postService = await getPostService();
  const posts = await postService.getPosts();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Posts</h1>
      <PostsClient initialPosts={posts} />
    </div>
  );
}
