import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Image, Video, FileText, X } from "lucide-react";

export const PostCreation = () => {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [objectUrls, setObjectUrls] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const queryClient = useQueryClient();

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosInstance.post("/posts/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Post created successfully");
      setContent("");
      setSelectedFiles([]);
      setCurrentImageIndex(0);
      // Cleanup object URLs
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      setObjectUrls([]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create post");
    },
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith("image/") || 
                         file.type.startsWith("video/") || 
                         file.type === "application/pdf";
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      return isValidType && isValidSize;
    });
    
    // Create object URLs for images and videos
    const newUrls = validFiles.map(file => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    
    setObjectUrls(prev => [...prev, ...newUrls.filter(url => url !== null)]);
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
  };

  const removeFile = (index) => {
    const fileToRemove = selectedFiles[index];
    
    // Cleanup object URL if it exists
    if (fileToRemove.type.startsWith("image/") || fileToRemove.type.startsWith("video/")) {
      const url = URL.createObjectURL(fileToRemove);
      URL.revokeObjectURL(url);
      setObjectUrls(prev => prev.filter(u => u !== url));
    }
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Adjust current index if needed
    if (currentImageIndex >= selectedFiles.length - 1 && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedFiles.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedFiles.length) % selectedFiles.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) {
      toast.error("Please add content or files");
      return;
    }

    const formData = new FormData();
    formData.append("content", content);
    selectedFiles.forEach(file => {
      formData.append("files", file);
    });

    createPost(formData);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return <Image size={16} />;
    if (file.type.startsWith("video/")) return <Video size={16} />;
    if (file.type === "application/pdf") return <FileText size={16} />;
    return null;
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you want to talk about?"
          className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        
        {/* File Preview - Clean Slider */}
        {selectedFiles.length > 0 && (
          <div className="mt-3">
            <div className="relative border rounded-lg overflow-hidden">
              {selectedFiles[currentImageIndex].type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(selectedFiles[currentImageIndex])}
                  alt="Preview"
                  className="w-full h-80 object-cover"
                />
              ) : selectedFiles[currentImageIndex].type.startsWith("video/") ? (
                <video className="w-full h-80 object-cover" controls>
                  <source src={URL.createObjectURL(selectedFiles[currentImageIndex])} />
                </video>
              ) : (
                <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">{selectedFiles[currentImageIndex].name}</p>
                  </div>
                </div>
              )}
              
              {/* Navigation arrows - Only show if multiple files */}
              {selectedFiles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 rounded-full p-3 hover:bg-opacity-100 shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 rounded-full p-3 hover:bg-opacity-100 shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(currentImageIndex)}
                className="absolute top-3 right-3 bg-white bg-opacity-90 text-red-500 rounded-full p-2 hover:bg-opacity-100 shadow-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-3">
          <input
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200"
          >
            Add Media
          </label>
          
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};