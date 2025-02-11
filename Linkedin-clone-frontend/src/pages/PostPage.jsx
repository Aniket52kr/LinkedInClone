import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "../components/Sidebar"
import { Post } from "../components/Post";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";



export const PostPage = () => {
  const { postId } = useParams();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => axiosInstance.get(`/posts/${postId}`),
  });
  
  if (isLoading) return <div>Loading post...</div>;
  if (!post.data) return <div>Post not found</div>;

  return (
    <div className="bg-[#F4F2EE] py-5 px-32 min-h-screen overflow-x-hidden grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="hidden lg:block lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      <div className="col-span-1 lg:col-span-3">
        <Post post={post.data} />
      </div>
    </div>
  );
};