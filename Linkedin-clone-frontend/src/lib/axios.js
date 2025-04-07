import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://linkedinclone-w8w1.onrender.com",
  withCredentials: true,
});
