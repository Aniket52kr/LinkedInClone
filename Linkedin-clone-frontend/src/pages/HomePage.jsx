import { axiosInstance } from "../lib/axios";
import { Sidebar } from "../components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { PostCreations } from "../components/PostCreations";
import { Post } from "../components/Post";
import { Users } from "lucide-react";
import { RecommendedUser } from "../components/RecommendedUser";



export const HomePage = () => {
  const { data: authUser, isLoading: authUserLoading, isError: authUserError } = useQuery({
    queryKey: ["authUser"],
  });

  const { data: recommendedUsers, isLoading: recommendedUsersLoading, isError: recommendedUsersError } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/users/suggestions");
      return res.data;
    },
  });

  const { data: posts, isLoading: postsLoading, isError: postsError } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/posts");
      return res.data;
    },
  });

  // Handle errors
  if (authUserError || recommendedUsersError || postsError) {
    return (
      <div className="bg-[#F4F2EE] w-full py-5 px-32 min-h-screen text-center">
        <p className="text-red-500">There was an error loading the data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F2EE] w-full py-5 px-32 min-h-screen grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      {!authUserLoading && authUser && (
        <div className="hidden lg:block lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
      )}

      {/* Posts */}
      <div className="col-span-1 lg:col-span-2 order-first lg:order-none">
        <PostCreations user={authUser} />

        {postsLoading ? (
          <div className="text-center">Loading posts...</div>
        ) : (
          posts?.map((post) => <Post key={post._id} post={post} />)
        )}

        {posts?.length === 0 && !postsLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-6">
              <Users size={64} className="mx-auto text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">No Posts Yet</h2>
            <p className="text-gray-600 mb-6">
              Connect with others to start seeing Posts in your feed!
            </p>
          </div>
        )}
      </div>

      {/* Recommended Users */}
      {recommendedUsersLoading ? (
        <div className="col-span-1 lg:col-span-1 hidden lg:block text-center">Loading recommended users...</div>
      ) : (
        recommendedUsers?.length > 0 && (
          <div className="col-span-1 lg:col-span-1 hidden lg:block">
            <div className="bg-white fixed rounded-lg shadow p-4">
              <h2 className="font-semibold mb-4">People you may know</h2>
              {recommendedUsers?.map((user) => (
                <RecommendedUser key={user._id} user={user} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};
