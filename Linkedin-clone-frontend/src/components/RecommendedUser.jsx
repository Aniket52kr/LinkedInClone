import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { Link } from "react-router-dom";
import avatarImg from "../assets/images/avatar.png";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "react-hot-toast"; 
import PropTypes from "prop-types"; 


export const RecommendedUser = ({ user }) => {
  const queryClient = useQueryClient();
  
  const { data: connectionStatus, isLoading } = useQuery({
    queryKey: ["connectionStatus", user._id],
    queryFn: () => axiosInstance.get(`/connections/status/${user._id}`),
  });

  const { mutate: sendConnectionRequest } = useMutation({
    mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
    onSuccess: (data) => {
      toast.success("Connection request sent successfully");
  
      queryClient.setQueryData(
        ["connectionStatus", user._id],
        { data: { status: "pending", requestId: data.request._id } }
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "An error occurred");
    },
  });

  const { mutate: acceptRequest } = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request accepted");
      queryClient.invalidateQueries({
        queryKey: ["connectionStatus", user._id],
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "An error occurred");
    },
  });

  const { mutate: rejectRequest } = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request rejected");
      queryClient.invalidateQueries({
        queryKey: ["connectionStatus", user._id],
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "An error occurred");
    },
  });

  const renderButton = () => {
    if (isLoading) {
      return (
        <button
          className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-500"
          disabled
        >
          Loading...
        </button>
      );
    }

    switch (connectionStatus?.data?.status) {
      case "pending":
        return (
          <button
            className="px-3 py-1 rounded-full text-sm bg-yellow-500 text-white flex items-center"
            disabled
          >
            <Clock size={16} className="mr-1" />
            Pending
          </button>
        );
      case "received":
        return (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => acceptRequest(connectionStatus.data.requestId)}
              className={`rounded-full p-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white`}
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => rejectRequest(connectionStatus.data.requestId)}
              className={`rounded-full p-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white`}
            >
              <X size={16} />
            </button>
          </div>
        );
      case "connected":
        return (
          <button
            className="px-3 py-1 rounded-full text-sm bg-green-500 text-white flex items-center"
            disabled
          >
            <UserCheck size={16} className="mr-1" />
            Connected
          </button>
        );
      default:
        return (
          <button
            className="px-3 py-1 rounded-full text-sm text-[#0A66C2] border border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition duration-200 flex items-center"
            onClick={handleConnect}
          >
            <UserPlus size={15} className="mr-2" />
            Connect
          </button>
        );
    }
  };

  const handleConnect = () => {
    if (connectionStatus?.data.status === "not_connected") {
      sendConnectionRequest(user._id);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <Link
        to={`/profile/${user.userName}`}
        className="flex items-center flex-grow"
      >
        <img
          src={user.profilePicture || avatarImg}
          alt=""
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h3 className="font-semibold text-sm">{user.firstName}</h3>
          <p className="text-xs text-info">{user.headline}</p>
        </div>
      </Link>
      {renderButton()}
    </div>
  );
};

// PropTypes Validation
RecommendedUser.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    profilePicture: PropTypes.string,
    headline: PropTypes.string,
  }).isRequired,
};

export default RecommendedUser;
