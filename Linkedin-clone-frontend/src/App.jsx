import { Routes, Route, Navigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
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



function App() {
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
  
  if (isLoading) {
    return null;
  }

  console.log("authUser", authUser);

  return (
    <>
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
            element={
              authUser ? <NotificationsPage /> : <Navigate to={"/login"} />
            }
          />
          <Route
            path="/network"
            element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/post/:postId"
            element={authUser ? <PostPage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/profile/:userName"
            element={authUser ? <Profilepage/> : <Navigate to={"/login"} />}
          />
        </Routes>
        <Toaster />
      </div>
    </>
  );
}

export default App;