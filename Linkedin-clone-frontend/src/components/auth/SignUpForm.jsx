import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios.js";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";


const SignUpForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const queryClient = useQueryClient();

  const { mutate: signUpMutation, isLoading } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/register", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Something went wrong");
    },
  });

  const handleSignUp = (e) => {
    e.preventDefault();
    signUpMutation({ firstName, lastName, userName, email, password });
  };
  return (
    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="input w-full border border-gray-400 hover:border-black hover:bg-gray-200 rounded-md p-2 bg-white"
        required
      />
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="input w-full border border-gray-400 hover:border-black hover:bg-gray-200 rounded-md p-2 bg-white"
        required
      />
      <input
        type="text"
        placeholder="Username"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="input w-full border border-gray-400 hover:border-black hover:bg-gray-200 rounded-md p-2 bg-white"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input w-full border border-gray-400 hover:border-black hover:bg-gray-200 rounded-md p-2 bg-white"
        required
      />
      <input
        type="password"
        placeholder="Password (6+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input w-full border border-gray-400 hover:border-black hover:bg-gray-200 rounded-md p-2 bg-white"
        required
      />

      <button type = "submit" disabled={isLoading} className="btn w-full bg-[#0077b5] text-white text-center font-semibold border-none rounded-full py-3 ">
        {isLoading ? (
          <Loader className="size-5 animate-spin" />
        ) : (
          "Agree & Join"
        )}
      </button>
    </form>
  );
};

export default SignUpForm;