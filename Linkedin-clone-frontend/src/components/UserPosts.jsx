import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { Post } from "./Post";
import { Loader2 } from "lucide-react";

export const UserPosts = ({ userName }) => {
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ["userPosts", userName],
    queryFn: async () => {
      const res = await axiosInstance.get(`/posts/user/${userName}`);
      return res.data;
    },
    enabled: !!userName,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-gray-600">
        Error loading posts. Please try again.
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
        <p>This user hasn't posted anything yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Posts ({posts.length})
      </h3>
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  );
};