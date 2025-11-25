import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { useSocket } from "../contexts/SocketContext";
import { Search, Send, MessageCircle, ArrowLeft, UserPlus, X, Paperclip, Smile, Trash2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EmojiPicker from 'emoji-picker-react';



export const MessagesPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { socket, onlineUsers, joinUser } = useSocket();
  const queryClient = useQueryClient();

  // Helper function to check if user is online or not 
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    return `Last Seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` 
  };

  // Get current user
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
  });

  // Get conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get("/messages/conversations");
      return res.data;
    },
  });

  // Search users to start new conversation
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["userSearch", userSearchTerm],
    queryFn: async () => {
      if (!userSearchTerm.trim()) return [];
      const res = await axiosInstance.get(`/users/search?query=${userSearchTerm}`);
      return res.data;
    },
    enabled: !!userSearchTerm.trim(),
  });

  // Get messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedConversation?.user._id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const res = await axiosInstance.get(`/messages/messages/${selectedConversation.user._id}`);
      return res.data;
    },
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('recipientId', selectedConversation.user._id);
        formData.append('content', message.trim());
        
        const res = await axiosInstance.post("/messages/send-file", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return res.data;
      } else {
        const res = await axiosInstance.post("/messages/send", {
          recipientId: selectedConversation.user._id,
          content: message.trim(),
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["conversations"]);
      queryClient.invalidateQueries(["messages", selectedConversation?.user._id]);
      setMessage("");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      const res = await axiosInstance.delete(`/messages/${messageId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["conversations"]);
      queryClient.invalidateQueries(["messages", selectedConversation?.user._id]);
    },
  });

  // Join socket room when user is available
  useEffect(() => {
    if (authUser?._id) {
      joinUser(authUser._id);
    }
  }, [authUser, joinUser]);

  // Check for auto-start conversation from profile message button
  useEffect(() => {
    const startChatWith = localStorage.getItem("startChatWith");
    if (startChatWith) {
      try {
        const user = JSON.parse(startChatWith);
        const newConversation = {
          user,
          lastMessage: {
            content: "Start a conversation",
            createdAt: new Date(),
          },
          unreadCount: 0,
        };
        setSelectedConversation(newConversation);
        localStorage.removeItem("startChatWith"); // Clean up
      } catch (error) {
        console.error("Error parsing startChatWith data:", error);
        localStorage.removeItem("startChatWith");
      }
    }
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('newMessage', (newMessage) => {
        queryClient.invalidateQueries(["conversations"]);
        if (selectedConversation && newMessage.sender === selectedConversation.user._id) {
          queryClient.invalidateQueries(["messages", selectedConversation.user._id]);
        }
      });

      // Listen for message deletion
      socket.on('messageDeleted', (messageId) => {
        queryClient.invalidateQueries(["conversations"]);
        queryClient.invalidateQueries(["messages", selectedConversation?.user._id]);
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageDeleted');
      };
    }
  }, [socket, selectedConversation, queryClient]);

  // Handle sending message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((message.trim() || selectedFile) && selectedConversation) {
      sendMessageMutation.mutate();
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  // Handle message deletion
  const handleDeleteMessage = (messageId) => {
    deleteMessageMutation.mutate(messageId);
  };

  // Start new conversation with user
  const startConversation = (user) => {
    const newConversation = {
      user,
      lastMessage: {
        content: "Start a conversation",
        createdAt: new Date(),
      },
      unreadCount: 0,
    };
    setSelectedConversation(newConversation);
    setShowUserSearch(false);
    setUserSearchTerm("");
  };

  // Filter conversations based on search
  const filteredConversations = conversations?.filter(conv =>
    conv.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Conversations List - Fixed Position */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
        {/* Header Section - Fixed */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messaging</h1>
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <UserPlus size={20} className="text-blue-600" />
            </button>
          </div>
          
          {/* User Search for New Conversation */}
          {showUserSearch && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Start new conversation</h3>
                <button onClick={() => setShowUserSearch(false)}>
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Search Results */}
              {userSearchTerm && (
                <div className="mt-2 max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <div className="text-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : searchResults?.length > 0 ? (
                    searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => startConversation(user)}
                      >
                        <img
                          src={user.profilePicture || "/default-avatar.png"}
                          alt={user.firstName}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">@{user.userName}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">No users found</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Conversation Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 && !showUserSearch ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <MessageCircle size={48} className="mb-2" />
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Click the + button to start a new conversation</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.user._id}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedConversation?.user._id === conversation.user._id ? "bg-blue-50" : ""
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="relative">
                  <img
                    src={conversation.user.profilePicture || "/default-avatar.png"}
                    alt={conversation.user.firstName}
                    className="w-12 h-12 rounded-full mr-3 flex-shrink-0"
                  />
                  {/* Online status indicator */}
                  <div className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-white ${
                    isUserOnline(conversation.user._id) ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold truncate text-gray-900">
                      {conversation.user.firstName} {conversation.user.lastName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage.content}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area - LinkedIn Style Colors */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header - Fixed at Top */}
            <div className="p-4 border-b border-gray-200 flex items-center flex-shrink-0 bg-white">
              {selectedConversation && (
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden mr-3"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="relative">
                <img
                  src={selectedConversation.user.profilePicture || "/default-avatar.png"}
                  alt={selectedConversation.user.firstName}
                  className="w-10 h-10 rounded-full mr-3"
                />
                {/* Online status indicator */}
                <div className={`absolute bottom-0 right-2 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  isUserOnline(selectedConversation.user._id) ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {isUserOnline(selectedConversation.user._id) 
                    ? 'Active now' 
                    : selectedConversation.user.lastSeen 
                      ? formatLastSeen(selectedConversation.user.lastSeen)
                      : 'Offline'
                  }
                </p>
              </div>
            </div>

            {/* Messages - ONLY This Area Scrolls */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                messages?.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender._id === authUser?._id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                        msg.sender._id === authUser?._id
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {/* Delete button for own messages */}
                      {msg.sender._id === authUser?._id && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      
                      {/* Handle different message types */}
                      {msg.messageType === 'image' && msg.fileUrl ? (
                        <div>
                          <img 
                            src={msg.fileUrl} 
                            alt="Shared image" 
                            className="max-w-full rounded-lg mb-2 cursor-pointer"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                          />
                          {msg.content && <p>{msg.content}</p>}
                        </div>
                      ) : msg.messageType === 'file' && msg.fileUrl ? (
                        <div>
                          <a 
                            href={msg.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <Paperclip size={16} />
                            <span className="text-sm">View attachment</span>
                          </a>
                          {msg.content && <p className="mt-2">{msg.content}</p>}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      
                      <p className={`text-xs mt-1 ${
                        msg.sender._id === authUser?._id ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input - Fixed at Bottom */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
              {/* File Preview */}
              {previewUrl && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* File Name Preview */}
              {selectedFile && !previewUrl && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Paperclip size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                
                <div className="flex items-center space-x-1">
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                  >
                    <Paperclip size={20} />
                  </button>

                  {/* Emoji Button */}
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    >
                      <Smile size={20} />
                    </button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50">
                        <EmojiPicker 
                          onEmojiClick={handleEmojiSelect}
                          theme="light"
                          height={350}
                          width={300}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Input */}
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isLoading}
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4" />
              <p className="text-xl">Select a conversation to start messaging</p>
              <p className="text-sm mt-2">Or click the + button to start a new conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};