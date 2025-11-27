import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { ProfileHeader } from "../components/ProfileHeader";
import { AboutSection } from "../components/AboutSection";
import { ExperienceSection } from "../components/ExperienceSection";
import { EducationSection } from "../components/EducationSection";
import { SkillsSection } from "../components/SkillsSection";
import { UserPosts } from "../components/UserPosts";



export const Profilepage = () => {
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

  if (isUserProfileLoading) return <p>Loading...</p>;

  const isOwnProfile = authUser?.userName === userProfile?.userName;
  const userData = userProfile; 

  const handleSave = (updatedData) => {
    updateProfile(updatedData);
  };

  console.log("User Data:", userData);

  return (
    <div className="bg-[#F4F2EE] py-5 px-80 min-h-screen w-full mx-auto p-4">
      <ProfileHeader userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
      <AboutSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
      <ExperienceSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
      <EducationSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
      <SkillsSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
      <UserPosts userName={userName} />
    </div>
  );
};