import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { Sidebar } from "../components/Sidebar";
import { FriendRequest } from "../components/FriendRequest";
import { UserPlus, Users, Link2 } from "lucide-react";
import { UserCard } from "../components/UserCard";



export const NetworkPage = () => {
  const { data: user } = useQuery({ queryKey: ["authUser"] });

  const { data: connectionRequests, isError: connectionRequestsError } =
    useQuery({
      queryKey: ["connectionRequests"],
      queryFn: async () => {
        return axiosInstance.get("/connections/requests");
      },
    });

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: () => axiosInstance.get("/connections/"),
  });


  const { data: suggestedConnections } = useQuery({
    queryKey: ["suggestedConnections"],
    queryFn: () => axiosInstance.get("/users/suggestions"),
  });

  if (connectionRequestsError) {
    return <div>Error loading connection requests.</div>;
  }


  return (
    <div className="bg-[#F4F2EE] py-5 px-[20vh] min-h-screen grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="col-span-1 lg:col-span-1">
        <Sidebar user={user} />
      </div>
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">My Network</h1>
          
          {/* Connection Requests Section */}
          {connectionRequests?.data?.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <UserPlus className="mr-2" size={24} />
                Connection Requests ({connectionRequests.data.length})
              </h2>
              <div className="space-y-4">
                {connectionRequests.data.map((request) => (
                  <FriendRequest key={request.id} request={request} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center mb-8 border border-gray-200">
              <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Pending Requests
              </h3>
              <p className="text-gray-600">
                You don&apos;t have any pending connection requests at the moment.
              </p>
            </div>
          )}

          {/* Suggested Connections Section */}
          {suggestedConnections?.data?.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2" size={24} />
                People You May Know ({suggestedConnections.data.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedConnections.data.map((suggestedUser) => (
                  <UserCard
                    key={suggestedUser._id}
                    user={suggestedUser}
                    isConnection={false}
                    showConnectButton={true}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center mb-8 border border-gray-200">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Suggestions Available
              </h3>
              <p className="text-gray-600">
                We don&apos;t have any suggested connections for you right now. Try connecting with more people!
              </p>
            </div>
          )}

          {/* Existing Connections Section */}
          {connections?.data?.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Link2 className="mr-2" size={24} />
                Your Connections ({connections.data.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.data.map((connection) => (
                  <UserCard
                    key={connection._id}
                    user={connection}
                    isConnection={true}
                    showConnectButton={false}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
              <Link2 size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Connections Yet
              </h3>
              <p className="text-gray-600">
                Start building your network by connecting with people suggested above!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};