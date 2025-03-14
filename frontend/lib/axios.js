import axios from "axios";
console.log(import.meta.env.VITE_BACKEND_URL);
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});
export default axiosInstance;
