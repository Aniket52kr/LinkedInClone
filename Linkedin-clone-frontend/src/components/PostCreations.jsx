import PropTypes from "prop-types"; 
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import avatarImg from "../assets/images/avatar.png";
import { Loader } from "lucide-react"; 



export const PostCreations = ({ user }) => {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null); 
  const [filePreview, setFilePreview] = useState(null); 
  const [fileType, setFileType] = useState(null); 
  const queryClient = useQueryClient();

  const { mutate: createPostMutation, isPending } = useMutation({
    mutationFn: async (postData) => {
      const res = await axiosInstance.post("/posts/create", postData, {
        headers: { "Content-Type": "multipart/form-data" }, 
      });
      return res.data;
    },
    onSuccess: () => {
      resetForm();
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create post");
    },
  });

  const handlePostCreation = async () => {
    try {
      const formData = new FormData();
      formData.append("content", content);

      if (file) {
        formData.append("file", file); 
      }

      createPostMutation(formData); 
    } catch (error) {
      console.error("Error in handlePostCreation:", error);
    }
  };

  const resetForm = () => {
    setContent("");
    setFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const fileType = selectedFile?.type;

    if (fileType) {
      // Check file type and set the file accordingly
      if (fileType.startsWith("image")) {
        setFile(selectedFile);
        setFileType("image");
        readFileAsDataURL(selectedFile).then(setFilePreview); 
      } else if (fileType.startsWith("video")) {
        setFile(selectedFile);
        setFileType("video");
        setFilePreview(URL.createObjectURL(selectedFile)); 
      } else if (fileType === "application/pdf") {
        setFile(selectedFile);
        setFileType("pdf");
        setFilePreview("pdf"); 
      } else {
        toast.error("Unsupported file type. Only image, video, and PDF are allowed.");
      }
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow mb-4 p-4">
      <div className="flex space-x-3">
        <img
          src={user.profilePicture || avatarImg}
          alt={user.firstName}
          className="size-12 rounded-full"
        />
        <textarea
          placeholder="What's on your mind?"
          className="w-full p-3 rounded-lg bg-[#f4f2ee] hover:bg-[#f4f3ee] focus:bg-base-200 focus:outline-none resize-none transition-colors duration-200 min-h-[100px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* Display image preview */}
      {filePreview && fileType === "image" && (
        <div className="mt-4">
          <img src={filePreview} alt="Selected" className="w-full h-auto rounded-lg" />
        </div>
      )}

      {/* Display video preview */}
      {fileType === "video" && (
        <div className="mt-4">
          <video width="100%" controls>
            <source src={filePreview} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Display PDF preview */}
      {fileType === "pdf" && (
        <div className="mt-4 text-center">
          <p className="text-xl">PDF Selected</p>
          {/* You can add an icon here if needed */}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-4">
          <label className="flex items-center text-info hover:text-info-dark transition-colors duration-200 cursor-pointer">
            <span className="mr-2">Upload File</span>
            <input
              type="file"
              name="file" 
              accept="image/*,video/*,application/pdf" 
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <button
          className="bg-[#0266c8] text-white rounded-lg px-4 py-2 hover:bg-primary-dark transition-colors duration-200"
          onClick={handlePostCreation}
          disabled={isPending}
        >
          {isPending ? <Loader className="size-5 animate-spin" /> : "Share"}
        </button>
      </div>
    </div>
  );
};

PostCreations.propTypes = {
  user: PropTypes.shape({
    profilePicture: PropTypes.string,
    firstName: PropTypes.string.isRequired,
  }).isRequired,
};
