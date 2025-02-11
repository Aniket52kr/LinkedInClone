import PropTypes from "prop-types"; 
import { Link } from "react-router-dom";
import avatarImg from "../assets/images/avatar.png";



export const UserCard = ({ user, isConnection }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center transition-all hover:shadow-md">
      <Link
        to={`/profile/${user.userName}`}
        className="flex flex-col items-center"
      >
        <img
          src={user.profilePicture || avatarImg}
          alt={user.firstName}
          className="w-24 h-24 rounded-full object-cover mb-4"
        />
        <h3 className="font-semibold text-lg text-center">{user.firstName}</h3>
      </Link>
      <p className="text-gray-600 text-center">{user.headline}</p>
      <p className="text">{user.connections?.length} connections</p>
      <button className="mt-4 bg-[#0A66C2] text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors w-full">
        {isConnection ? "Connected" : "Connect"}
      </button>
    </div>
  );
};

// PropTypes Validation
UserCard.propTypes = {
  user: PropTypes.shape({
    userName: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    profilePicture: PropTypes.string,
    headline: PropTypes.string,
    connections: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isConnection: PropTypes.bool.isRequired,
};

export default UserCard;
