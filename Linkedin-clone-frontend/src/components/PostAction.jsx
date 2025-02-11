import PropTypes from "prop-types"; 

export const PostAction = ({ icon, text, onClick }) => {
  return (
    <button className="flex items-center" onClick={onClick}>
      <span className="mr-1">{icon}</span>
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
};


PostAction.propTypes = {
  icon: PropTypes.element.isRequired, 
  text: PropTypes.string.isRequired, 
  onClick: PropTypes.func, 
};
