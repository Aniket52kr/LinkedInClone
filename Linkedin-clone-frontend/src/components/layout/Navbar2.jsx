import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Home, Briefcase, UserPlus, MessageSquare, Bell, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

export const Navbar2 = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/notifications");
      return res.data;
    },
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get("/messages/conversations");
      return res.data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login");
      toast.success("Logged out successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Logout failed");
    },
  });


  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.put("/notifications/mark-all-read");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    },
  });

  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;
  const unreadMessages = conversations?.reduce((acc, conv) => acc + conv.unreadCount, 0) || 0;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-blue-600 text-2xl font-bold">
              linkedin
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:bg-white focus:border focus:border-gray-300"
              />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-1 md:space-x-4">
            <Link to="/" className='text-neutral flex flex-col items-center relative p-2 hover:bg-gray-100 rounded'>
              <Home size={20} />
              <span className='text-xs hidden md:block mt-1'>Home</span>
            </Link>

            <Link to='/network' className='text-neutral flex flex-col items-center relative p-2 hover:bg-gray-100 rounded'>
              <UserPlus size={20} />
              <span className='text-xs hidden md:block mt-1'>My Network</span>
            </Link>

            <Link to='/messages' className='text-neutral flex flex-col items-center relative p-2 hover:bg-gray-100 rounded'>
              <MessageSquare size={20} />
              <span className='text-xs hidden md:block mt-1'>Messaging</span>
              {unreadMessages > 0 && (
                <span className='absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            <Link 
              to='/notifications' 
              className='text-neutral flex flex-col items-center relative p-2 hover:bg-gray-100 rounded'
              onClick={() => {
                // Mark all notifications as read when clicking notifications
                if (unreadNotifications > 0) {
                  markAllNotificationsReadMutation.mutate();
                }
              }}
            >
              <Bell size={20} />
              <span className='text-xs hidden md:block mt-1'>Notifications</span>
              {unreadNotifications > 0 && (
                <span className='absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )} 
            </Link>

            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                <img
                  src={authUser?.profilePicture || "/default-avatar.png"}
                  alt={authUser?.firstName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:block text-sm">Me</span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to={`/profile/${authUser?.userName}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={logoutMutation.isLoading}
                >
                  {logoutMutation.isLoading ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};