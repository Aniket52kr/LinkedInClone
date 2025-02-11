import PropTypes from "prop-types"; 
import bannerImg from "../assets/images/banner.png";
import avatarImg from "../assets/images/avatar.png";
import { Link } from "react-router-dom";
import { Bell, Home, UserPlus } from "lucide-react";



export const Sidebar = ({ user }) => {
  return (
    <div className="bg-white rounded-lg shadow w-[19%] fixed">
      <div className="p-4 text-center">
        <div
          className="h-16 rounded-t-lg bg-cover bg-center"
          style={{
            backgroundImage: `url("${user.bannerImg || bannerImg}")`,
          }}
        />
        <Link to={`/profile/${user.userName}`}>
          <img
            src={user.profilePicture || avatarImg}
            alt={user.firstName}
            className="w-20 h-20 rounded-full mx-auto mt-[-40px]"
          />
          <h2 className="text-xl font-semibold mt-2">{user.firstName}</h2>
        </Link>
        <p className="text-info">{user.headline}</p>
        <p className="text-info text-xs">
          {user.connections.length} connections
        </p>
      </div>
      <div className="border-t border-base-100 p-4">
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="flex items-center py-2 px-4 rounded-md hover:text-gray-500 transition-colors"
              >
                <Home className="mr-2" size={20} /> Home
              </Link>
            </li>
            <li>
              <Link
                to="/network"
                className="flex items-center py-2 px-4 rounded-md hover:text-gray-500 transition-colors"
              >
                <UserPlus className="mr-2" size={20} /> My Network
              </Link>
            </li>
            <li>
              <Link
                to="/notifications"
                className="flex items-center py-2 px-4 rounded-md hover:text-gray-500 transition-colors"
              >
                <Bell className="mr-2" size={20} /> Notifications
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-base-100 p-4">
        <Link
          to={`/profile/${user.userName}`}
          className="text-sm font-semibold"
        >
          Visit your profile
        </Link>
      </div>
    </div>
  );
};

// PropTypes Validation
Sidebar.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    profilePicture: PropTypes.string,
    headline: PropTypes.string,
    bannerImg: PropTypes.string,
    connections: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

export default Sidebar;
