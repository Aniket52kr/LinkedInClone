import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { ProfileHeader } from "../components/ProfileHeader";
import { AboutSection } from "../components/AboutSection";
import { ExperienceSection } from "../components/ExperienceSection";
import { EducationSection } from "../components/EducationSection";
import { SkillsSection } from "../components/SkillsSection";
import { UserPosts } from "../components/UserPosts";



export const Profilepage = () => {
  const { userId } = useParams();
  
  const { userName } = useParams();
  const queryClient = useQueryClient();

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
    queryKey: ["userProfile", userName],
    queryFn: async () => {
      const response = await axiosInstance.get(`/users/${userName}`);
      return response.data;
    },
    enabled: !!userName, 
  });


  // ADD PROFILE VIEW TRACKING
  const { mutate: trackProfileView } = useMutation({
    mutationFn: async (userId) => {
      console.log("TRACKING: Sending profile view request for userId:", userId);
      const response = await axiosInstance.post(`/users/track-profile-view/${userId}`);
      console.log("SUCCESS: Profile view tracked successfully");
      return response.data;
    },
    onSuccess: (data) => {
      console.log("RESPONSE:", data);
    },
    onError: (error) => {
      console.log("ERROR: Profile view tracking failed:", error.response?.data || error.message);
    }
  });

  // ADD EFFECT TO TRACK PROFILE VIEW
  useEffect(() => {
    if (authUser && userProfile && authUser._id !== userProfile._id) {
      console.log("👀 PROFILE VIEW DETECTED:", {
        viewer: `${authUser.firstName} ${authUser.lastName} (ID: ${authUser._id})`,
        profile: `${userProfile.firstName} ${userProfile.lastName} (ID: ${userProfile._id})`,
        isOwnProfile: false
      });
      trackProfileView(userProfile._id);
    } else {
      console.log("🚫 SKIPPING PROFILE VIEW:", {
        hasAuthUser: !!authUser,
        hasUserProfile: !!userProfile,
        isOwnProfile: authUser?._id === userProfile?._id
      });
    }
  }, [authUser, userProfile, trackProfileView]);

  
  const { mutate: updateProfile } = useMutation({
    mutationFn: async (updatedData) => {
      await axiosInstance.put("/users/profile", updatedData);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries(["userProfile", userName]); 
      queryClient.invalidateQueries(["authUser"]); 
    },
  });

  if (isUserProfileLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading profile...</span>
    </div>
  );

  const isOwnProfile = authUser?.userName === userProfile?.userName;
  const userData = userProfile || {}; 

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    ); 
  }

  const handleSave = (updatedData) => {
    updateProfile(updatedData);
  };

  console.log("User Data:", userData);

  return (
    <div className="bg-[#F4F2EE] py-5 px-80 min-h-screen w-full mx-auto p-4">
      {userData && <ProfileHeader userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />}
    
      <div className="mt-6">
        {userData && <AboutSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />}
      </div>
    
      <div className="mt-6">
        {userData && <ExperienceSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />}
      </div>
    
      <div className="mt-6">
        {userData && <EducationSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />}
      </div>
    
      <div className="mt-6">
        {userData && <SkillsSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />}
      </div>
    
      <div className="mt-6">
        {userData && <UserPosts userName={userName} isOwnProfile={authUser?.userName === userName} />}
      </div>
    </div>
  );
};