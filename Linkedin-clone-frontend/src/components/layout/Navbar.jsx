import Logo from "../../assets/images/linkedin logo.png";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";


export const Navbar = () => {
  return (
    <div className="navbar w-full h-1/10 px-44 flex items-center justify-between shadow-md">
      <div className="logo h-32">
        <img src={Logo} className="h-full w-full" alt="Linkedin Logo" />
      </div>
      <div className="flex h-full w-[63%] items-center justify-between">
        <div className="cursor-pointer text-gray-800 hover:text-gray-500 flex flex-col items-center justify-center">
          <Icon icon="majesticons:article-line" className="text-2xl" />
          <div className="text-sm">Articles</div>
        </div>
        <div className="cursor-pointer text-gray-800 hover:text-gray-500 flex flex-col items-center justify-center">
          <Icon icon="ic:outline-people" className="text-2xl" />
          <div className="text-sm">Peoples</div>
        </div>
        <div className="cursor-pointer text-gray-800 hover:text-gray-500 flex flex-col items-center justify-center">
          <Icon icon="arcticons:linkedin-learning" className="text-2xl" />
          <div className="text-sm"> Learning</div>
        </div>
        <div className="cursor-pointer text-gray-800 hover:text-gray-500 flex flex-col items-center justify-center">
          <Icon icon="hugeicons:job-search" className="text-2xl" />
          <div className="text0sm">Jobs</div>
        </div>
        <div className="cursor-pointer text-gray-800 hover:text-gray-500 flex flex-col items-center justify-center">
          <Icon
            icon="material-symbols-light:toys-and-games"
            className="text-2xl"
          />
          <div className="text-sm">Games</div>
        </div>
        <div className="border-r border-gray-800 h-3/4"></div>
        <div className="cursor-pointer text-gray-800 hover:text-gray-500 flex flex-col items-center justify-center">
          <Icon icon="ic:round-laptop" className="text-2xl" />
          <div className="text-sm">Get the App</div>
        </div>
        <div className="border-r border-gray-800 h-3/4"></div>
        <Link
          to="/login"
          className=" cursor-pointer text-sm font-semibold border-none rounded-full px-6 py-3 hover:bg-gray-100"
        >
          Join Now
        </Link>
        <Link
          to="/signup"
          className="cursor-pointer text-sm font-semibold text-blue-400 border border-blue-400 rounded-full px-6 py-3 hover:bg-blue-100"
        >
          Sign Now
        </Link>
      </div>
    </div>
  );
};