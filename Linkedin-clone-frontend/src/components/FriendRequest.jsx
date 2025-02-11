import { useMutation, useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types"; 
import { axiosInstance } from "../lib/axios";
import { Link } from "react-router-dom";
import avatarImg from "../assets/images/avatar.png";
import { toast } from "react-toastify"; 

export const FriendRequest = ({ request }) => {
  const queryClient = useQueryClient();

  const { mutate: acceptConnectionRequest } = useMutation({
    mutationFn: (requestId) =>
      axiosInstance.put(`/connections/accept/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request accepted");
      queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "An error occurred");
    },
  });

  const { mutate: declineConnectionRequest } = useMutation({
    mutationFn: (requestId) =>
      axiosInstance.put(`/connections/reject/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request declined");
      queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "An error occurred");
    },
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <Link to={`/profile/${request.sender.userName}`}>
          <img
            src={request.sender.profilePicture || avatarImg}
            alt={request.sender.firstName}
            className="w-16 h-16 rounded-full object-cover"
          />
        </Link>
        <div>
          <Link
            to={`/profile/${request.sender.userName}`}
            className="font-semibold text-lg"
          >
            {request.sender.firstName}
          </Link>
          <p className="text-gray-600">{request.sender.headline}</p>
        </div>
      </div>

      <div className="space-x-2">
        <button
          className="bg-[#0A66C2] text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          onClick={() => acceptConnectionRequest(request._id)}
        >
          Accept
        </button>
        <button
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          onClick={() => declineConnectionRequest(request._id)}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

// PropTypes validation
FriendRequest.propTypes = {
  request: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    sender: PropTypes.shape({
      userName: PropTypes.string.isRequired,
      profilePicture: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      headline: PropTypes.string,
    }).isRequired,
  }).isRequired,
};
