import PropTypes from "prop-types"; 
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import avatarImg from "../assets/images/avatar.png";

export const UserCard = ({ user, isConnection, showConnectButton = true }) => {
  const queryClient = useQueryClient();

  // Send connection request mutation
  const sendConnectionRequestMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await axiosInstance.post(`/connections/request/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Connection request sent!");
      queryClient.invalidateQueries(["suggestedConnections"]);
      queryClient.invalidateQueries(["connectionRequests"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  const handleConnect = () => {
    if (!isConnection && showConnectButton) {
      sendConnectionRequestMutation.mutate(user._id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center transition-all hover:shadow-md border border-gray-200">
      <Link
        to={`/profile/${user.userName}`}
        className="flex flex-col items-center w-full"
      >
        <img
          src={user.profilePicture || avatarImg}
          alt={user.firstName}
          className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-gray-100"
        />
        <h3 className="font-semibold text-lg text-center">{user.firstName} {user.lastName}</h3>
      </Link>
      <p className="text-gray-600 text-center text-sm mb-2">{user.headline}</p>
      <p className="text-gray-500 text-xs text-center mb-4">
        {user.connections?.length || 0} connections
      </p>
      
      {showConnectButton && !isConnection && (
        <button 
          onClick={handleConnect}
          disabled={sendConnectionRequestMutation.isLoading}
          className="mt-2 bg-[#0A66C2] text-white px-4 py-2 rounded-md hover:bg-[#004182] transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendConnectionRequestMutation.isLoading ? "Sending..." : "Connect"}
        </button>
      )}
      
      {isConnection && (
        <button 
          disabled
          className="mt-2 bg-gray-200 text-gray-600 px-4 py-2 rounded-md cursor-not-allowed w-full"
        >
          Connected
        </button>
      )}
    </div>
  );
};

// PropTypes Validation
UserCard.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string,
    profilePicture: PropTypes.string,
    headline: PropTypes.string,
    connections: PropTypes.array,
  }).isRequired,
  isConnection: PropTypes.bool,
  showConnectButton: PropTypes.bool,
};

export default UserCard;