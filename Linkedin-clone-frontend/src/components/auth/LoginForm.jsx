import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";


export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: loginMutation, isLoading } = useMutation({
    mutationFn: (userData) => axiosInstance.post("/auth/login", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/"); 
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    loginMutation({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input w-[30vw] py-3 px-3 border border-gray-300 rounded-md"
        autoComplete="off"
        aria-label="Email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input w-[30vw] py-3 px-3 border border-gray-300 rounded-md"
        autoComplete="off"
        aria-label="Password"
      />
      <button
        type="submit"
        className="w-full bg-[#0077b5] text-white font-semibold rounded-full py-3 flex items-center justify-center"
      >
        {isLoading ? <Loader className="size-5 animate-spin" /> : "Login"}
      </button>
    </form>
  );
};
