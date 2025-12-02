import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Edit2, X, Image, Video, FileText } from "lucide-react"; 
import PropTypes from "prop-types"; 
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import {
  Loader,
  MessageCircle,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import avtarImg from "../assets/images/avatar.png";
import { PostAction } from "./PostAction";


export const Post = ({ post }) => {
  const { postId } = useParams();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || "");
  const [editImages, setEditImages] = useState(post?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  const mediaItems = useMemo(() => {
    const items = [];

    if (post?.images && post.images.length > 0) {
      items.push(
        ...post.images.map((img) => ({
          type: "image",
          url: img.url,
          publicId: img.publicId,
        }))
      );
    }

    if (post?.videoUrl) {
      items.push({
        type: "video",
        url: post.videoUrl,
      });
    }

    if (post?.documentUrl) {
      items.push({
        type: "document",
        url: post.documentUrl,
      });
    }
    return items;
  }, [post]);

  const currentEditImage = useMemo(() => {
    return editImages[currentImageIndex] || null;
  }, [editImages, currentImageIndex]);

  // Reset index if out of bounds
  useEffect(() => {
    const total = isEditing ? editImages.length : mediaItems.length;

    if (total > 0 && currentImageIndex >= total) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, editImages.length, mediaItems.length, isEditing]);

  // Handle click outside to close share dialog
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareDialog && !event.target.closest('.share-dialog')) {
        setShowShareDialog(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareDialog]);

  const isOwner = authUser?._id === post?.author?._id;
  const isLiked = post?.likes?.includes(authUser?._id);
  const queryClient = useQueryClient();

  // delete post mutation
  const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/posts/delete/${post._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // edit post mutation
  const { mutate: editPost, isPending: isEditingPost } = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosInstance.put(`/posts/edit/${post._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      toast.success("Post edited successfully");
      setIsEditing(false);
      setNewFiles([]);
      setImagesToRemove([]);
    },
    onError: (error) => {
      toast.error(error.message);
    }, 
  });

  // create comment mutation
  const { mutate: createComment, isPending: isAddingComment } = useMutation({
    mutationFn: async (newCommentText) => {
      await axiosInstance.post(`/posts/${post._id}/comment`, {
        content: newCommentText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added successfully");
    },
    onError: (err) => {
      const errorMessage =
        err?.response?.data?.message || "Failed to add comment";
      toast.error(errorMessage);
    },
  });

  // like post mutation - optimistic update for faster UI
  const { mutate: likePost, isPending: isLikingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/posts/${post._id}/like`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      const toggleLikes = (p) => {
        if (!p) return p;
        const alreadyLiked = p.likes?.includes(authUser?._id);
        const newLikes = alreadyLiked
          ? p.likes.filter((id) => id !== authUser?._id)
          : [...(p.likes || []), authUser?._id];

        return { ...p, likes: newLikes };
      };

      if (previousPosts) {
        queryClient.setQueryData(["posts"], (old) =>
          old.map((p) => (p._id === post._id ? toggleLikes(p) : p))
        );
      }

      if (previousPost) {
        queryClient.setQueryData(["post", postId], (old) => toggleLikes(old));
      }

      return { previousPosts, previousPost };
    },
    onError: (error, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }

      const msg =
        error?.response?.data?.message || "Failed to like post";
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  // Handle share button click
  const handleShareClick = () => {
    const postUrl = `${window.location.origin}/posts/${post._id}`;
    setShareUrl(postUrl);
    setShowShareDialog(post._id);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
    setShowShareDialog(null);
  };

  // Share on different platforms
  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, '_blank');
    setShowShareDialog(null);
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check out this post!`;
    window.open(twitterUrl, '_blank');
    setShowShareDialog(null);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank');
    setShowShareDialog(null);
  };

  // Close share dialog
  const closeShareDialog = () => {
    setShowShareDialog(null);
    setShareUrl('');
  };

  const handleDeletePost = () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    deletePost();
  };

  const handleLikePost = async () => {
    if (isLikingPost) return;
    likePost();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createComment(newComment);
      setNewComment("");
      setComments([
        ...comments,
        {
          _id: Date.now().toString(),
          content: newComment,
          user: {
            _id: authUser._id,
            name: authUser.firstName,
            profilePicture: authUser.profilePicture,
          },
          createdAt: new Date(),
        },
      ]);
    }
  };

  const handleEditPost = () => {
    setIsEditing(true);
    setEditContent(post?.content || "");
    setEditImages(post?.images || []);
    setNewFiles([]);
    setImagesToRemove([]);
    setCurrentImageIndex(0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post?.content || "");
    setEditImages(post?.images || []);
    setNewFiles([]);
    setImagesToRemove([]);
    setCurrentImageIndex(0);
  };

  const handleSaveEdit = () => {
    const formData = new FormData();
    formData.append("content", editContent);
    
    // Add images to remove
    if (imagesToRemove.length > 0) {
      formData.append("imagesToRemove", JSON.stringify(imagesToRemove));
      console.log("Added imagesToRemove to formData:", JSON.stringify(imagesToRemove));
    }
    
    // Add new files
    newFiles.forEach(file => {
      formData.append("files", file);
    });

    // Debug log formData contents
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    editPost(formData);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith("image/") || 
                     file.type.startsWith("video/") || 
                     file.type === "application/pdf";
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      return isValidType && isValidSize;
    });
    
    setNewFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
  };

  const removeNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (publicId) => {
    if (!publicId) return;
  
    setEditImages(prev => {
      const newImages = prev.filter(img => img.publicId !== publicId);
      // Reset current index if it's out of bounds
      if (currentImageIndex >= newImages.length && newImages.length > 0) {
        setCurrentImageIndex(0);
      } else if (newImages.length === 0) {
        setCurrentImageIndex(0);
      }
      return newImages;
    });
  
    setImagesToRemove(prev => [...prev, publicId]);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return <Image size={16} />;
    if (file.type.startsWith("video/")) return <Video size={16} />;
    if (file.type === "application/pdf") return <FileText size={16} />;
    return null;
  };

  const nextImage = () => {
    if (mediaItems.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevImage = () => {
    if (mediaItems.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  return (
    <div className="bg-white rounded-lg shadow mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link to={`/profile/${post?.author?.userName}`}>
              <img
                src={post?.author?.profilePicture || avtarImg}
                alt={post?.author?.firstName}
                className="size-10 rounded-full mr-3"
              />
            </Link>

            <div>
              <Link to={`/profile/${post?.author?.userName}`}>
                <h3 className="font-semibold">{post?.author?.firstName}</h3>
              </Link>
              <p className="text-xs text-info">{post?.author?.headline}</p>
              <p className="text-xs text-info">
                {formatDistanceToNow(new Date(post?.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={handleEditPost}
                  className="text-gray-500 hover:text-blue-500 transition-colors"
                  disabled={isEditingPost}
                >
                  <Edit2 size={16} />
                </button>
              )}
              <button
                onClick={handleDeletePost}
                className="text-red-500 hover:text-red-700"
              >
                {isDeletingPost ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Edit Form or Content Display */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What do you want to talk about?"
            />
            
            {/* Existing Images in Edit Mode - Clean */}
            {editImages.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Current images:</p>
                <div className="relative border rounded-lg overflow-hidden">
                  {editImages[currentImageIndex] && (
                    <img
                      src={editImages[currentImageIndex].url}
                      alt="Current image"
                      className="w-full h-90 object-cover"
                    />
                  )}
                  
                  {/* Navigation for edit mode - Only show if multiple images */}
                  {editImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + editImages.length) % editImages.length)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 rounded-full p-2 hover:bg-opacity-100 shadow-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % editImages.length)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 rounded-full p-2 hover:bg-opacity-100 shadow-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
  
                  {/* Remove button with proper publicId */}
                  {editImages[currentImageIndex] && (
                    <button
                      type="button"
                      onClick={() => removeExistingImage(editImages[currentImageIndex].publicId)}
                      className="absolute top-2 right-2 bg-white bg-opacity-90 text-red-500 rounded-full p-2 hover:bg-opacity-100 shadow-lg transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* New Files in Edit Mode */}
            {newFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">New files to add:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className="relative border rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(file)}
                        <span className="text-xs truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Files Button */}
            <div className="mt-3">
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="edit-file-input"
              />
              <label
                htmlFor="edit-file-input"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 text-sm"
              >
                Add More Media
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full"
                disabled={isEditingPost}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                disabled={isEditingPost}
              >
                {isEditingPost ? <Loader size={16} /> : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4">{post?.content}</p>
            
            {/* Edited Timestamp */}
            {post?.isEdited && (
              <p className="text-xs text-gray-500 mb-4">
                Edited {formatDistanceToNow(new Date(post.editedAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </>
        )}

        {/* Unified Media Slider (images + video + document) */}
        {mediaItems.length > 0 && (
          <div className="mt-4">
            <div className="relative border rounded-lg overflow-hidden bg-black/5">
              {(() => {
                const currentMedia = mediaItems[currentImageIndex];

                if (!currentMedia) return null;

                if (currentMedia.type === "image") {
                  return (
                    <img
                      src={currentMedia.url}
                      alt="Post media"
                      className="w-full h-90 object-cover"
                    />
                  );
                }

                if (currentMedia.type === "video") {
                  return (
                    <video
                      controls
                      className="w-full rounded-lg max-h-96 object-cover bg-black"
                      preload="metadata"
                    >
                      <source src={currentMedia.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  );
                }

                if (currentMedia.type === "document") {
                  return (
                    <div className="mt-0 p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-red-100 p-2 rounded mr-3">
                          📄
                        </div>
                        <div>
                          <p className="font-semibold text-sm">PDF Document</p>
                          <p className="text-xs text-gray-600">Click to view</p>
                        </div>
                      </div>

                      <a
                        href={currentMedia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                      >
                        View PDF
                      </a>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Navigation arrows - show if more than 1 media item */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 rounded-full p-3 hover:bg-opacity-100 shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 rounded-full p-3 hover:bg-opacity-100 shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between text-info">
          <PostAction
            icon={
              <ThumbsUp
                size={18}
                className={isLiked ? "text-blue-500  fill-blue-300" : ""}
              />
            }
            text={`Like (${post?.likes?.length || 0})`}
            onClick={handleLikePost}
          />

          <PostAction
            icon={<MessageCircle size={18} />}
            text={`Comment (${comments.length})`}
            onClick={() => setShowComments(!showComments)}
          />
          <PostAction 
            icon={<Share2 size={18} />} 
            text="Share" 
            onClick={handleShareClick}
          />
        </div>
      </div>

      {showComments && (
        <div className="px-4 pb-4">
          <div className="mb-4 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="bg-[#F4F2EE] mb-2 bg-base-100 p-2 rounded flex items-start"
              >
                <img
                  src={comment?.user?.profilePicture || avtarImg}
                  alt={comment?.user?.firstName}
                  className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                />
                <div className="flex-grow">
                  <div className="flex items-center mb-1">
                    <span className="font-semibold mr-2">
                      {comment?.user?.firstName}
                    </span>
                    <span className="text-xs text-info">
                      {formatDistanceToNow(new Date(comment?.createdAt))}
                    </span>
                  </div>
                  <p>{comment?.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex items-center">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-[#F4F2EE] flex-grow p-2 rounded-l-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              type="submit"
              className="bg-[#0A66C2] text-white p-2 rounded-r-full hover:bg-primary-dark transition duration-300"
              disabled={isAddingComment}
            >
              {isAddingComment ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog === post._id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 share-dialog">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share this post</h3>
              <button 
                onClick={closeShareDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Share Options */}
            <div className="space-y-3">
              {/* Copy Link */}
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      🔗
                    </div>
                    <span className="text-sm font-medium text-gray-900">Copy link</span>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              {/* LinkedIn */}
              <button 
                onClick={shareOnLinkedIn}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">in</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Share on LinkedIn</span>
              </button>
              
              {/* Twitter */}
              <button 
                onClick={shareOnTwitter}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">𝕏</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Share on Twitter</span>
              </button>
              
              {/* Facebook */}
              <button 
                onClick={shareOnFacebook}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">f</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Share on Facebook</span>
              </button>
              
              {/* WhatsApp */}
              <button 
                onClick={() => {
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this post: ${shareUrl}`)}`;
                  window.open(whatsappUrl, '_blank');
                  setShowShareDialog(null);
                }}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📱</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Share on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Post.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        publicId: PropTypes.string.isRequired,
      })
    ),
    videoUrl: PropTypes.string,
    videoPublicId: PropTypes.string,
    documentUrl: PropTypes.string,
    documentPublicId: PropTypes.string,
    isEdited: PropTypes.bool,
    editedAt: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    author: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      userName: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      headline: PropTypes.string,
      profilePicture: PropTypes.string,
    }).isRequired,
    likes: PropTypes.arrayOf(PropTypes.string).isRequired,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        user: PropTypes.object.isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
};