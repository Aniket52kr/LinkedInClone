import PropTypes from "prop-types"; 
import { useState } from "react";
import { X } from "lucide-react";



export const SkillsSection = ({ userData, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState(userData.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const handleDeleteSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSave = () => {
    onSave({ skills });
    setIsEditing(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Skills</h2>
      <div className="flex flex-wrap">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2 flex items-center"
          >
            {skill}
            {isEditing && (
              <button
                onClick={() => handleDeleteSkill(skill)}
                className="ml-2 text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
      </div>

      {isEditing && (
        <div className="mt-4 flex">
          <input
            type="text"
            placeholder="New Skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-grow p-2 border rounded-l"
          />
          <button
            onClick={handleAddSkill}
            className="bg-[#084A9E] text-white py-2 px-4 rounded-r hover:bg-primary-dark transition duration-300"
          >
            Add Skill
          </button>
        </div>
      )}

      {isOwnProfile && (
        <>
          {isEditing ? (
            <button
              onClick={handleSave}
              className="mt-4 bg-[#084A9E] text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 text-[#084A9E] hover:text-primary-dark transition duration-300"
            >
              Edit Skills
            </button>
          )}
        </>
      )}
    </div>
  );
};

// PropTypes Validation
SkillsSection.propTypes = {
  userData: PropTypes.shape({
    skills: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isOwnProfile: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default SkillsSection;