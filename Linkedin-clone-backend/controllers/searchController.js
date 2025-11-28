const User = require("../models/user");
const Post = require("../models/post");

// Advanced search with filters
const advancedSearch = async (req, res) => {
  try {
    console.log("Search request received:", req.query);
    
    const { 
      query, 
      type = 'all', 
      location,
      skills,
      experience,
      education,
      page = 1,
      limit = 10
    } = req.query;

    // Check if user is authenticated
    if (!req.user) {
      console.log("No user found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const currentUserId = req.user._id;
    console.log("Current user ID:", currentUserId);
    
    let results = {
      people: [],
      posts: [],
      total: 0
    };

    // Search People
    if (type === 'people' || type === 'all') {
      const peopleQuery = {
        _id: { $ne: currentUserId }
      };

      // Add text search - FIXED: Use proper regex format
      if (query && query.trim()) {
        const searchRegex = { $regex: query, $options: "i" };
        peopleQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { userName: searchRegex },
          { headline: searchRegex },
          { about: searchRegex }
        ];
      }

      // Add location filter
      if (location && location.trim()) {
        peopleQuery.location = { $regex: location, $options: "i" };
      }

      // Add skills filter
      if (skills && skills.trim()) {
        const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        if (skillsArray.length > 0) {
          peopleQuery.skills = { $in: skillsArray };
        }
      }

      // Add experience filter - FIXED: Use proper nested object query
      if (experience && experience.trim()) {
        peopleQuery['experience.title'] = { $regex: experience, $options: "i" };
      }

      // Add education filter
      if (education && education.trim()) {
        peopleQuery['education.school'] = { $regex: education, $options: "i" };
      }

      console.log("People query:", JSON.stringify(peopleQuery, null, 2));

      const people = await User.find(peopleQuery)
        .select("firstName lastName userName profilePicture headline location skills experience education connections")
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      console.log("Found people:", people.length);
      results.people = people;
    }

    // Search Posts
    if (type === 'posts' || type === 'all') {
      const postsQuery = {};

      if (query && query.trim()) {
        postsQuery.content = { $regex: query, $options: "i" };
      }

      console.log("Posts query:", JSON.stringify(postsQuery, null, 2));

      const posts = await Post.find(postsQuery)
        .populate("author", "firstName lastName userName profilePicture")
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      console.log("Found posts:", posts.length);
      results.posts = posts;
    }

    // Calculate total results
    let totalPeople = 0;
    let totalPosts = 0;

    if (type === 'people' || type === 'all') {
      const peopleQuery = { _id: { $ne: currentUserId } };
      if (query && query.trim()) {
        const searchRegex = { $regex: query, $options: "i" };
        peopleQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { userName: searchRegex },
          { headline: searchRegex },
          { about: searchRegex }
        ];
      }
      totalPeople = await User.countDocuments(peopleQuery);
    }

    if (type === 'posts' || type === 'all') {
      const postsQuery = {};
      if (query && query.trim()) {
        postsQuery.content = { $regex: query, $options: "i" };
      }
      totalPosts = await Post.countDocuments(postsQuery);
    }
    
    results.total = totalPeople + totalPosts;

    console.log("Final results:", {
      peopleCount: results.people.length,
      postsCount: results.posts.length,
      total: results.total
    });

    res.json({
      results,
      currentPage: parseInt(page),
      totalPages: Math.ceil(results.total / limit),
      hasMore: ((parseInt(page) - 1) * parseInt(limit)) + parseInt(limit) < results.total
    });

  } catch (error) {
    console.error("Advanced search error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Search suggestions/autocomplete
const getSearchSuggestions = async (req, res) => {
  try {
    console.log("Suggestions request received:", req.query);
    
    const { query, type = 'all' } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const currentUserId = req.user._id;

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    let suggestions = [];

    // People suggestions
    if (type === 'all' || type === 'people') {
      const searchRegex = { $regex: query, $options: "i" };
      const people = await User.find({
        _id: { $ne: currentUserId },
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { userName: searchRegex },
          { headline: searchRegex },
          { location: searchRegex},
          { skills: searchRegex},
          { connections: searchRegex}
        ]
      })
      .select("firstName lastName userName profilePicture headline location skills connections")
      .limit(5);

      suggestions.push(...people.map(person => ({
        type: 'person',
        id: person._id,
        title: `${person.firstName} ${person.lastName}`,
        subtitle: person.headline || `@${person.userName}`,
        image: person.profilePicture,
        userName: person.userName
      })));
    }

    // Skills suggestions - FIXED: Remove limit from distinct
    if (type === 'all' || type === 'skills') {
      const usersWithSkills = await User.find({
        skills: { $regex: query, $options: "i" }
      })
      .select("skills")
      .limit(10);

      const allSkills = [...new Set(
        usersWithSkills.flatMap(user => user.skills || [])
          .filter(skill => skill && skill.toLowerCase().includes(query.toLowerCase()))
      )].slice(0, 5);

      suggestions.push(...allSkills.map(skill => ({
        type: 'skill',
        title: skill,
        subtitle: 'Skill'
      })));
    }

    // Location suggestions - FIXED: Remove limit from distinct and use array slice
    if (type === 'all' || type === 'location') {
      const locations = await User.distinct("location", {
        location: { $regex: query, $options: "i" }
      });
      
      const limitedLocations = locations.slice(0, 5);

      suggestions.push(...limitedLocations.map(location => ({
        type: 'location',
        title: location,
        subtitle: 'Location'
      })));
    }

    console.log("Suggestions found:", suggestions.length);

    res.json({ suggestions: suggestions.slice(0, 10) });

  } catch (error) {
    console.error("Search suggestions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  advancedSearch,
  getSearchSuggestions
};