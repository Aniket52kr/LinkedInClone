import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { useSocket } from "../contexts/SocketContext";
import {
  Search,
  Send,
  MessageCircle,
  ArrowLeft,
  UserPlus,
  X,
  Paperclip,
  Smile,
  Trash2,
  Circle,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";

export const MessagesPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { socket, onlineUsers, joinUser } = useSocket();
  const queryClient = useQueryClient();


  // Helper to get file icon based on extension
  const getFileIcon = (fileName) => {
    if (!fileName) return <Paperclip size={18} className="text-blue-600" />;
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
          </svg>
        );
    
        case 'doc':
    
        case 'docx':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
          </svg>
        );
    
        case 'xls':
       
        case 'xlsx':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return <Paperclip size={18} className="text-blue-600" />;
    }
  };

  // Helper function to check if user is online or not
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "";
    return `Last Seen ${formatDistanceToNow(new Date(lastSeen), {
      addSuffix: true,
    })}`;
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
      const res = await axiosInstance.get(
        `/users/search?query=${userSearchTerm}`
      );
      return res.data;
    },
    enabled: !!userSearchTerm.trim(),
  });

  // Get messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedConversation?.user._id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const res = await axiosInstance.get(
        `/messages/messages/${selectedConversation.user._id}`
      );
      return res.data;
    },
    enabled: !!selectedConversation,
  });

  // Send message mutation (optimistic)
  const sendMessageMutation = useMutation({
    // variables = { content, file }
    mutationFn: async ({ content, file }) => {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("recipientId", selectedConversation.user._id);
        formData.append("content", content);

        const res = await axiosInstance.post("/messages/send-file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return res.data;
      } else {
        const res = await axiosInstance.post("/messages/send", {
          recipientId: selectedConversation.user._id,
          content,
        });
        return res.data;
      }
    },

    onMutate: async ({ content, file }) => {
      if (!selectedConversation) return;

      const conversationUserId = selectedConversation.user._id;

      await queryClient.cancelQueries(["messages", conversationUserId]);

      const previousMessages = queryClient.getQueryData([
        "messages",
        conversationUserId,
      ]);

      // Build optimistic message using the variables
      const optimisticMessage = {
        _id: "temp-" + Date.now(),
        sender: authUser,
        recipient: selectedConversation.user,
        content,
        messageType: file ? "file" : "text",
        fileUrl: file ? previewUrl : null,
        filePublicId: null,
        fileName: file ? file.name : "",
        createdAt: new Date().toISOString(),
        isRead: false,
        isEdited: false,
      };

      // Update cache
      queryClient.setQueryData(["messages", conversationUserId], (old) => {
        if (!old) return [optimisticMessage];
        return [...old, optimisticMessage];
      });

      // Clear UI immediately
      setMessage("");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return { previousMessages };
    },

    onError: (error, _vars, context) => {
      console.error("Error sending message:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Axios setup error:", error.message);
      }

      // rollback
      if (context?.previousMessages) {
        const conversationUserId = selectedConversation?.user._id;
        if (conversationUserId) {
          queryClient.setQueryData(
            ["messages", conversationUserId],
            context.previousMessages
          );
        }
      }
    },

    onSettled: () => {
      if (selectedConversation?.user._id) {
        queryClient.invalidateQueries(["conversations"]);
        queryClient.invalidateQueries([
          "messages",
          selectedConversation.user._id,
        ]);
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
      queryClient.invalidateQueries([
        "messages",
        selectedConversation?.user._id,
      ]);
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }) => {
      const res = await axiosInstance.put(`/messages/${messageId}`, {
        content,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["conversations"]);
      queryClient.invalidateQueries([
        "messages",
        selectedConversation?.user._id,
      ]);
      setEditingMessage(null);
      setMessage("");
    },
    onError: (error) => {
      console.error("Failed to edit message:", error);
    },
  });

  // mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (userId) => {
      await axiosInstance.post(`/messages/read/${userId}`);
    },
    onSuccess: (_data, userId) => {
      // update conversation and message for that user
      queryClient.invalidateQueries(["conversations"]);
      queryClient.invalidateQueries(["messages", userId]);
    },
    onError: (error) => {
      console.error("Failed to mark message as read:", error);
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
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on("newMessage", (newMessage) => {
        queryClient.invalidateQueries(["conversations"]);

        const newSenderId =
          typeof newMessage.sender === "object"
            ? newMessage.sender._id
            : newMessage.sender;
        const newRecipientId =
          typeof newMessage.recipient === "object"
            ? newMessage.recipient._id
            : newMessage.recipient;

        if (
          selectedConversation &&
          (newSenderId === selectedConversation.user._id ||
            newRecipientId === selectedConversation.user._id)
        ) {
          queryClient.invalidateQueries([
            "messages",
            selectedConversation.user._id,
          ]);
        }
      });

      // Listen for message deletion
      socket.on("messageDeleted", () => {
        queryClient.invalidateQueries(["conversations"]);
        if (selectedConversation?.user._id) {
          queryClient.invalidateQueries([
            "messages",
            selectedConversation.user._id,
          ]);
        }
      });

      // Listen for message edits
      socket.on("messageEdited", (editedMessage) => {
        queryClient.invalidateQueries(["conversations"]);

        const editedSenderId =
          typeof editedMessage.sender === "object"
            ? editedMessage.sender._id
            : editedMessage.sender;
        const editedRecipientId =
          typeof editedMessage.recipient === "object"
            ? editedMessage.recipient._id
            : editedMessage.recipient;

        if (
          selectedConversation &&
          (editedSenderId === selectedConversation.user._id ||
            editedRecipientId === selectedConversation.user._id)
        ) {
          queryClient.invalidateQueries([
            "messages",
            selectedConversation.user._id,
          ]);
        }
      });

      // NEW: listen for messagesRead (update unread counters in real-time)
      socket.on("messagesRead", () => {
        queryClient.invalidateQueries(["conversations"]);
      });

      return () => {
        socket.off("newMessage");
        socket.off("messageDeleted");
        socket.off("messageEdited");
        socket.off("messagesRead");
      };
    }
  }, [socket, selectedConversation, queryClient]);

  // Handle sending message (integrated with edit)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((message.trim() || selectedFile) && selectedConversation) {
      if (editingMessage) {
        // If editing, save the edit instead of sending new message
        editMessageMutation.mutate({
          messageId: editingMessage,
          content: message.trim(),
        });
      } else {
        // Normal send message with variables
        sendMessageMutation.mutate({
          content: message.trim(),
          file: selectedFile,
        });
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
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
    setMessage((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  // Handle message deletion
  const handleDeleteMessage = (messageId) => {
    deleteMessageMutation.mutate(messageId);
  };

  // Handle message editing (WhatsApp-style)
  const handleEditMessage = (messageObj) => {
    setEditingMessage(messageObj._id);
    setMessage(messageObj.content);
    // Focus on message input
    setTimeout(() => {
      const messageInput = document.querySelector(
        'input[placeholder*="message"]'
      );
      if (messageInput) {
        messageInput.focus();
        messageInput.select();
      }
    }, 100);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // When user clicks a conversation: select + mark as read
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (conversation?.user?._id) {
      markAsReadMutation.mutate(conversation.user._id);
    }
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
  const filteredConversations =
    conversations?.filter(
      (conv) =>
        conv.user.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
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
      <div
        className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
          selectedConversation ? "hidden md:flex" : ""
        }`}
      >
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
                <h3 className="text-sm font-semibold text-gray-700">
                  Start new conversation
                </h3>
                <button onClick={() => setShowUserSearch(false)}>
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
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
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.firstName}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full mr-2 bg-gray-200 flex items-center justify-center">
                            <User size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{user.userName}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No users found
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conversation Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
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
              <p className="text-sm mt-2">
                Click the + button to start a new conversation
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.user._id}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedConversation?.user._id === conversation.user._id
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="relative">
                  {conversation.user.profilePicture ? (
                    <img
                      src={conversation.user.profilePicture}
                      alt={conversation.user.firstName}
                      className="w-12 h-12 rounded-full mr-3 flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full mr-3 flex-shrink-0 bg-gray-200 flex items-center justify-center">
                      <User size={24} className="text-gray-500" />
                    </div>
                  )}
                  {/* Online status indicator */}
                  <div
                    className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-white ${
                      isUserOnline(conversation.user._id)
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold truncate text-gray-900">
                      {conversation.user.firstName} {conversation.user.lastName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(
                        new Date(conversation.lastMessage.createdAt),
                        { addSuffix: true }
                      )}
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
      <div
        className={`flex-1 flex flex-col ${
          selectedConversation ? "flex" : "hidden md:flex"
        }`}
      >
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
                {selectedConversation.user.profilePicture ? (
                  <img
                    src={selectedConversation.user.profilePicture}
                    alt={selectedConversation.user.firstName}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                )}
                {/* Online status indicator */}
                <div
                  className={`absolute bottom-0 right-2 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    isUserOnline(selectedConversation.user._id)
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.user.firstName}{" "}
                  {selectedConversation.user.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {isUserOnline(selectedConversation.user._id)
                    ? "Active now"
                    : selectedConversation.user.lastSeen
                    ? formatLastSeen(selectedConversation.user.lastSeen)
                    : "Offline"}
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
                    className={`flex ${
                      msg.sender._id === authUser?._id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                        msg.sender._id === authUser?._id
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {/* Action buttons for own messages */}
                      {msg.sender._id === authUser?._id && !editingMessage && (
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button
                            onClick={() => handleEditMessage(msg)}
                            className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                            title="Edit message"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            title="Delete message"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                      {/* Handle different message types */}
                      {msg.messageType === "image" && msg.fileUrl ? (
                        <div>
                          <img
                            src={msg.fileUrl}
                            alt="Shared image"
                            className="max-w-full rounded-lg mb-2 cursor-pointer"
                            onClick={() =>
                              window.open(msg.fileUrl, "_blank")
                            }
                          />
                          {msg.content && <p>{msg.content}</p>}
                        </div>
                      ) : msg.messageType === "file" && msg.fileUrl ? (
                        <div className="flex flex-col space-y-2">
                          {/* File attachment card */}
                          <div
                            className={`w-full px-3 py-2 rounded-md border ${
                              msg.sender._id === authUser?._id
                                ? "bg-blue-500/10 border-blue-200 text-white"
                                : "bg-gray-50 border-gray-200 text-gray-800"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center flex-shrink-0">
                                  {getFileIcon(msg.fileName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-sm font-medium truncate"
                                    title={msg.fileName || "Attachment"}
                                  >
                                    {msg.fileName ||
                                      (msg.fileUrl
                                        ? decodeURIComponent(
                                            msg.fileUrl
                                              .split("/")
                                              .pop()
                                              .split("?")[0]
                                          )
                                        : "Attachment")}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Click to open
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                                                {/* View */}
                                <button
                                  type="button"
                                  onClick={() => window.open(msg.fileUrl, "_blank")}
                                  className={`p-1 rounded hover:bg-blue-100 ${
                                    msg.sender._id === authUser?._id
                                      ? "text-blue-200 hover:text-blue-300"
                                      : "text-blue-600 hover:text-blue-700"
                                  }`}
                                  title="View"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                </button>
                                {/* Download */}
                                <a
                                  href={msg.fileUrl}
                                  download={msg.fileName || "download"}
                                  className={`p-1 rounded hover:bg-blue-100 ${
                                    msg.sender._id === authUser?._id
                                      ? "text-blue-200 hover:text-blue-300"
                                      : "text-blue-600 hover:text-blue-700"
                                  }`}
                                  title="Download"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Optional text with the file */}
                          {msg.content && (
                            <p className="text-sm leading-snug">{msg.content}</p>
                          )}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}

                      <p
                        className={`text-xs mt-1 ${
                          msg.sender._id === authUser?._id
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                        })}
                        {msg.isEdited && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input - Fixed at Bottom */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
              {/* Edit indicator */}
              {editingMessage && (
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-blue-600 font-medium">
                    Editing message...
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* File Preview - Hide during edit */}
              {!editingMessage && previewUrl && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current)
                        fileInputRef.current.value = "";
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* File Name Preview - Hide during edit */}
              {!editingMessage && selectedFile && !previewUrl && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Paperclip size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current)
                        fileInputRef.current.value = "";
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2"
              >
                {/* File Input - Hide during edit */}
                {!editingMessage && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                )}

                <div className="flex items-center space-x-1">
                  {/* File Attachment Button - Hide during edit */}
                  {!editingMessage && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    >
                      <Paperclip size={20} />
                    </button>
                  )}

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
                  placeholder={
                    editingMessage ? "Edit message..." : "Type a message..."
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (editingMessage && e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                />

                {/* Send/Edit Button */}
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={
                    (!message.trim() && !selectedFile) ||
                    sendMessageMutation.isLoading ||
                    editMessageMutation.isLoading
                  }
                >
                  {editingMessage ? (
                    editMessageMutation.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4" />
              <p className="text-xl">Select a conversation to start messaging</p>
              <p className="text-sm mt-2">
                Or click the + button to start a new conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};