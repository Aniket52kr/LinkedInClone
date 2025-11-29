import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { Plus, Grid3X3, Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, Paperclip, Send } from 'lucide-react';

export const UserPosts = ({ userName, isOwnProfile }) => {
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [showShareDialog, setShowShareDialog] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const postsToShow = showAllPosts ? 100 : 2;
  
  const queryClient = useQueryClient();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

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

  // Query for posts
  const { data: postsData, isLoading, isError, error } = useQuery({
    queryKey: ['userPosts', userName],
    queryFn: async () => {
      try {
        console.log("Fetching posts for userName:", userName);
        const res = await axiosInstance.get(`/posts/user/${userName}`);
        console.log("API Response:", res.data);
        return res.data;
      } catch (err) {
        console.error("Error fetching posts:", err);
        throw err;
      }
    },
    enabled: !!userName,
  });

  // like post mutation
  const { mutate: likePost, isPending: isLikingPost } = useMutation({
    mutationFn: async (postId) => {
      await axiosInstance.post(`/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts', userName] });
    },
    onError: (error) => {
      console.error("Error liking post:", error);
    },
  });

  // create comment mutation
  const { mutate: createComment, isPending: isAddingComment } = useMutation({
    mutationFn: async ({ postId, content }) => {
      await axiosInstance.post(`/posts/${postId}/comment`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts', userName] });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
    },
  });

  // Handle both response formats: array directly or { posts: array }
  const posts = Array.isArray(postsData) ? postsData : postsData?.posts || [];
  const displayPosts = posts.slice(0, postsToShow);

  // Handle file upload - single function for all media types
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      return file.type.startsWith('image/') || 
             file.type.startsWith('video/') || 
             file.type === 'application/pdf' || 
             file.type.includes('document');
    });
    
    setNewFiles(prev => [...prev, ...validFiles.map(file => ({ file, type: 'media' }))]);
  };

  // Remove new file
  const removeNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle remove existing media - FIXED VERSION
  const handleRemoveMedia = (type, index, publicId, postId) => {
    console.log("Removing media:", { type, index, publicId, postId });
    
    // Add to removal list
    setFilesToRemove(prev => [...prev, { type, index, publicId }]);
    
    // Immediately remove from UI by updating the posts data
    queryClient.setQueryData(['userPosts', userName], (oldData) => {
      const updatedPosts = Array.isArray(oldData) ? [...oldData] : [...(oldData?.posts || [])];
      const postIndex = updatedPosts.findIndex(p => p._id === postId);
      
      if (postIndex !== -1) {
        const post = updatedPosts[postIndex];
        
        if (type === 'image' && post.images) {
          post.images = post.images.filter((_, i) => i !== index);
        } else if (type === 'video') {
          post.videoUrl = null;
          post.videoPublicId = null;
        } else if (type === 'document') {
          post.documentUrl = null;
          post.documentPublicId = null;
        }
      }
      
      return updatedPosts;
    });
    
    console.log("Media removed from UI!");
  };

  // Handle share button click
  const handleShareClick = (post) => {
    const postUrl = `${window.location.origin}/posts/${post._id}`;
    setShareUrl(postUrl);
    setShowShareDialog(post._id);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
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

  // Handle like post
  const handleLikePost = (postId, e) => {
    e.preventDefault();
    if (isLikingPost) return;
    likePost(postId);
  };

  // Handle comment toggle
  const handleToggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Handle comment input change
  const handleCommentChange = (postId, value) => {
    setNewComment(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  // Handle add comment
  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const commentText = newComment[postId];
    
    if (commentText && commentText.trim()) {
      createComment({ postId, content: commentText });
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));
    }
  };

  // Handle post actions
  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setEditContent(post.content);
    setShowDropdown(null);
  };

  // Enhanced save edit with media
  const handleSaveEdit = async (postId) => {
    try {
      const formData = new FormData();
      formData.append('content', editContent);
      
      // Add new files - categorize by type
      newFiles.forEach(({ file }) => {
        if (file.type.startsWith('image/')) {
          formData.append('files', file);
        } else if (file.type.startsWith('video/')) {
          formData.append('video', file);
        } else if (file.type === 'application/pdf' || file.type.includes('document')) {
          formData.append('document', file);
        }
      });
      
      // Add files to remove
      if (filesToRemove.length > 0) {
        const filesToRemoveData = filesToRemove.map(item => ({
          type: item.type,
          index: item.index,
          publicId: item.publicId 
        }));
        formData.append('filesToRemove', JSON.stringify(filesToRemoveData));
        console.log("Files to remove:", filesToRemoveData);
      }
      
      await axiosInstance.put(`/posts/edit/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("Post updated successfully");
      setEditingPost(null);
      setEditContent('');
      setNewFiles([]);
      setFilesToRemove([]);
      
      // Refetch posts
      queryClient.invalidateQueries(['userPosts', userName]);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
    setNewFiles([]);
    setFilesToRemove([]);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axiosInstance.delete(`/posts/delete/${postId}`);
        console.log("Post deleted successfully");
        setShowDropdown(null);
        // Refetch posts to remove deleted post
        queryClient.invalidateQueries(['userPosts', userName]);
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="h-20 bg-gray-200 rounded mt-3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (isError) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts</h2>
        <div className="text-center py-8 text-gray-600">
          <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Error loading posts</p>
          <p className="text-sm mb-2">Please try again later</p>
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
            <p className="font-semibold">Debug Info:</p>
            <p>Error: {error?.message}</p>
            <p>Status: {error?.response?.status}</p>
            <p>Endpoint: /posts/user/{userName}</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced empty state
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts</h2>
        <div className="text-center py-12 text-gray-500">
          <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No posts yet</p>
          <p className="text-sm">
            {isOwnProfile 
              ? "Share your first post to get started" 
              : "This user hasn't posted anything yet"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Header with post count and controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {posts.length}
          </span>
        </div>
        {/* Always show Show All/Less button if there are posts */}
        {posts.length > 0 && (
          <button
            onClick={() => setShowAllPosts(!showAllPosts)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
          >
            {showAllPosts ? (
              <>
                <Grid3X3 size={20} />
                Show less
              </>
            ) : (
              <>
                <Plus size={20} />
                Show all posts ({posts.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Posts Grid */}
      <div className="space-y-4">
        {displayPosts.map((post, index) => (
          <div 
            key={post._id} 
            className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200 group"
          >
            <div className="flex items-start space-x-3">
              {/* Use author field */}
              <img
                src={post.author?.profilePicture || "/default-avatar.png"}
                alt={post.author?.firstName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    {/* Use author field */}
                    <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                      {post.author?.firstName} {post.author?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: new Date(post.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwnProfile && (
                      <div className="relative">
                        <button 
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                          onClick={() => setShowDropdown(showDropdown === post._id ? null : post._id)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showDropdown === post._id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[160px]">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Edit size={16} />
                              Edit post
                            </button>
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                              Delete post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Enhanced Post Content with Edit Mode */}
                <div className="mt-3">
                  {editingPost === post._id ? (
                    // Enhanced Edit Mode with Media Management
                    <div className="space-y-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="What do you want to talk about?"
                      />
                      
                      {/* Current Media Display */}
                      {(post.images && post.images.length > 0) || post.videoUrl || post.documentUrl ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700">Current media:</p>
                          
                          {/* Current Images */}
                          {post.images && post.images.length > 0 && (
                            <div className="space-y-2">
                              {post.images.map((image, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                                  <img src={image.url} alt={`Current image ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-700">Image {index + 1}</p>
                                    <p className="text-xs text-gray-500">Click remove to delete</p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveMedia('image', index, image.publicId, post._id)}
                                    className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Current Video */}
                          {post.videoUrl && (
                            <div className="flex items-center gap-3 p-2 border rounded-lg">
                              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                🎥
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">Video</p>
                                <p className="text-xs text-gray-500">Click remove to delete</p>
                              </div>
                              <button
                                onClick={() => handleRemoveMedia('video', 0, post.videoPublicId, post._id)}
                                className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          
                          {/* Current Document */}
                          {post.documentUrl && (
                            <div className="flex items-center gap-3 p-2 border rounded-lg">
                              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                                📄
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">Document</p>
                                <p className="text-xs text-gray-500">Click remove to delete</p>
                              </div>
                              <button
                                onClick={() => handleRemoveMedia('document', 0, post.documentPublicId, post._id)}
                                className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}
                      
                      {/* Add New Media Section */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Add new media:</p>
                        
                        {/* Single Upload Media Button */}
                        <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer font-medium text-sm inline-flex items-center gap-2">
                          <Paperclip size={16} />
                          Upload Media
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        
                        {/* New Files Preview */}
                        {newFiles.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">New files to upload:</p>
                            {newFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <span className="text-sm text-gray-700">{file.file.name}</span>
                                <span className="text-xs text-gray-400">
                                  ({file.file.type.startsWith('image/') ? 'Image' : 
                                    file.file.type.startsWith('video/') ? 'Video' : 'Document'})
                                </span>
                                <button
                                  onClick={() => removeNewFile(index)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(post._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Save changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                      
                      {/* Enhanced Images Display - IMPROVED */}
                      {post.images && post.images.length > 0 && (
                        <div className={`mt-3 ${
                          post.images.length === 1 ? 'grid-cols-1' :
                          post.images.length === 2 ? 'grid-cols-2' :
                          post.images.length === 3 ? 'grid-cols-3' :
                          post.images.length === 4 ? 'grid-cols-2' :
                          'grid-cols-3'
                        } grid gap-2`}>
                          {post.images.map((image, index) => (
                            <div key={index} className={`relative overflow-hidden rounded-lg ${
                              post.images.length === 1 ? 'col-span-1' :
                              post.images.length === 2 ? 'aspect-video' :
                              post.images.length === 3 && index === 0 ? 'col-span-2 row-span-2' :
                              post.images.length === 4 ? 'aspect-square' :
                              'aspect-square'
                            }`}>
                              <img
                                src={image.url}
                                alt={`Post image ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => window.open(image.url, '_blank')}
                              />
                              {post.images.length > 4 && index === 3 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                  <span className="text-white text-2xl font-bold">+{post.images.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Video Display */}
                      {post.videoUrl && (
                        <div className="mt-3">
                          <video
                            controls
                            className="w-full rounded-lg max-h-96 object-cover"
                            preload="metadata"
                          >
                            <source src={post.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      
                      {/* Document Display */}
                      {post.documentUrl && (
                        <div className="mt-3">
                          <a
                            href={post.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              📄
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Document</p>
                              <p className="text-xs text-gray-500">Click to view document</p>
                            </div>
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Engagement Section */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    {/* left side like button */}
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={(e) => handleLikePost(post._id, e)}
                        className={`flex items-center space-x-2 transition-colors group ${
                          post.likes?.includes(authUser?._id) 
                            ? 'text-blue-600' 
                            : 'text-gray-500 hover:text-blue-600'
                        }`}
                        disabled={isLikingPost}
                      >
                        <Heart 
                          size={20} 
                          className={`group-hover:scale-110 transition-transform ${
                            post.likes?.includes(authUser?._id) ? 'fill-current' : ''
                          }`} 
                        />
                        <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                      </button>
                    </div>

                    {/* middle for comment button */}
                    <div>
                      <button 
                        onClick={() => handleToggleComments(post._id)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors group"
                      >
                        <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                      </button>
                    </div>
                    
                    {/* right side for share button */}
                    <div>   
                      <button 
                        onClick={() => handleShareClick(post)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors group"
                      >
                        <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                {showComments[post._id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      {/* Existing Comments */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="max-h-60 overflow-y-auto space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment._id} className="flex items-start space-x-3">
                              <img
                                src={comment.user?.profilePicture || "/default-avatar.png"}
                                alt={comment.user?.firstName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {comment.user?.firstName} {comment.user?.lastName}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add Comment Form */}
                      <form onSubmit={(e) => handleAddComment(post._id, e)} className="flex items-center space-x-2">
                        <img
                          src={authUser?.profilePicture || "/default-avatar.png"}
                          alt={authUser?.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <input
                          type="text"
                          value={newComment[post._id] || ''}
                          onChange={(e) => handleCommentChange(post._id, e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          disabled={isAddingComment || !newComment[post._id]?.trim()}
                        >
                          {isAddingComment ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </form>
                    </div>
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
                      
                      {/* Preview URL */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Post URL:</p>
                        <p className="text-xs text-gray-700 truncate">{shareUrl}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LinkedIn-style Show More Posts Button */}
      {posts.length > 1 && !showAllPosts && (
        <div className="mt-6">
          <div className="border-t pt-4">
            <button
              onClick={() => setShowAllPosts(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Show more posts
            </button>
            <p className="text-center text-xs text-gray-500 mt-2">
              Showing {displayPosts.length} of {posts.length} posts
            </p>
          </div>
        </div>
      )}

      {/* Show Less Posts Button */}
      {showAllPosts && posts.length > 1 && (
        <div className="mt-6">
          <div className="border-t pt-4">
            <button
              onClick={() => setShowAllPosts(false)}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Grid3X3 size={20} />
              Show less posts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};