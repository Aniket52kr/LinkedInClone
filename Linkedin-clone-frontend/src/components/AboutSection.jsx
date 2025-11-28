import PropTypes from "prop-types";
import { useState } from "react";


export const AboutSection = ({ userData = { about: "" }, isOwnProfile, onSave }) => {
  // safety check 
  if (!userData) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState(userData.about);

  const handleSave = () => {
    setIsEditing(false);
    onSave({ about });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">About</h2>
      {isEditing ? (
        <>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full p-2 border rounded"
            rows="4"
          />
          <button
            onClick={handleSave}
            className="mt-2 bg-[#084A9E] text-white py-2 px-4 rounded transition duration-300"
          >
            Save
          </button>
        </>
      ) : (
        <p>{userData.about || "No about information provided."}</p>
      )}
      {isOwnProfile && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-2 text-[#084A9E] hover:text-primary-dark transition duration-300"
        >
          Edit
        </button>
      )}
    </div>
  );
};

AboutSection.propTypes = {
  userData: PropTypes.shape({
    about: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
};
