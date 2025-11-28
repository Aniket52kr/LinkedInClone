import { Routes, Route, Navigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./contexts/SocketContext";
import { axiosInstance } from "./lib/axios";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { HomePage } from "./pages/HomePage";
import { Navbar } from "./components/layout/Navbar";
import { Navbar2 } from "./components/layout/Navbar2";
import { NotificationsPage } from "./pages/NotificationsPage";
import { NetworkPage } from "./pages/NetworkPage";
import { PostPage } from "./pages/PostPage";
import { Profilepage } from "./pages/ProfilePage";
import { MessagesPage } from "./pages/MessagesPage";
import { SearchPage } from "./pages/SearchPage";
import { SocketProvider } from "./contexts/SocketContext";


// CREATE A SEPARATE COMPONENT FOR SOCKET LOGIC
function AppContent() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
      } catch (err) {
        if (err.response && err.response.status == 401) {
          return null;
        }
        toast.error(err.response.status || "Something went wrong");
      }
    },
  });

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // profile view notification listener
  useEffect(() => {
    console.log(
      "SOCKET DEBUG: Effect running - socket:",
      !!socket,
      "authUser:",
      !!authUser
    );

    if (socket && authUser) {
      console.log(
        "SOCKET: Setting up profile view listener for:",
        authUser.firstName,
        "ID:",
        authUser._id
      );

      socket.on("profileViewed", (data) => {
        console.log("SOCKET: Received profile view notification:", data);
        console.log("NOTIFICATION: Toast skipped (removed)");
        console.log("QUERIES: Notifications invalidated");
      });

      // Add socket connection debugging
      socket.on("connect", () => {
        console.log("SOCKET: Connected to server, socket ID:", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("SOCKET: Disconnected from server");
      });

      socket.on("connect_error", (error) => {
        console.error("SOCKET: Connection error:", error);
      });

      return () => {
        console.log("SOCKET: Cleaning up all listeners");
        socket.off("profileViewed");
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
      };
    } else {
      console.log(
        "SOCKET: Not setting up listener - socket:",
        !!socket,
        "authUser:",
        !!authUser
      );
    }
  }, [socket, authUser, queryClient]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="App w-full h-screen bg-white">
      {authUser ? <Navbar2 /> : <Navbar />}

      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to={"/signup"} />}
        />

        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />}
        />

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}
        />

        <Route
          path="/notifications"
          element={authUser ? <NotificationsPage /> : <Navigate to={"/login"} />}
        />

        <Route
          path="/network"
          element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />}
        />

        <Route
          path="/messages"
          element={authUser ? <MessagesPage /> : <Navigate to={"/login"} />}
        />

        <Route
          path="/post/:postId"
          element={authUser ? <PostPage /> : <Navigate to={"/login"} />}
        />

        <Route
          path="/profile/:userName"
          element={authUser ? <Profilepage /> : <Navigate to={"/login"} />}
        />

        <Route
          path="/search"
          element={authUser ? <SearchPage /> : <Navigate to={"/login"} />}
        />
      </Routes>

      <Toaster />
    </div>
  );
}


// MAIN APP COMPONENT
function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App;
