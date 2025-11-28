import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Filter, X, MapPin, Briefcase, GraduationCap, Users, FileText, Clock, TrendingUp, Search } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useDebounce } from "../hooks/useDebounce";
import { User } from "lucide-react";

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    skills: searchParams.get('skills') || '',
    experience: searchParams.get('experience') || '',
    education: searchParams.get('education') || ''
  });

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);

  // Recent search management functions
  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('recentSearches');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading recent searches:', error);
      return [];
    }
  };

  const saveRecentSearches = (searches) => {
    try {
      localStorage.setItem('recentSearches', JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  const addRecentSearch = (search) => {
    const current = loadRecentSearches();
    const updated = [search, ...current.filter(s => s !== search)].slice(0, 10);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  const removeRecentSearch = (index) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type !== 'all') params.set('type', type);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [query, type, filters, setSearchParams]);

  // Search query with debouncing
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, type, filters],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { results: { people: [], posts: [] }, total: 0 };
      
      const params = new URLSearchParams();
      params.set('query', debouncedQuery);
      params.set('type', type);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      
      const res = await axiosInstance.get(`/search?${params.toString()}`);
      return res.data;
    },
    enabled: !!debouncedQuery.trim()
  });

  const clearFilters = () => {
    setFilters({
      location: '',
      skills: '',
      experience: '',
      education: ''
    });
  };


  const renderPersonCard = (person) => (
    <div 
      key={person._id} 
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 cursor-pointer group"
      onClick={() => navigate(`/profile/${person.userName}`)}
    >
      <div className="flex items-start space-x-3">
        {person.profilePicture ? (
          <img 
            src={person.profilePicture} 
            className="w-12 h-12 rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all" 
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-500 transition-all">
            <User size={20} className="text-gray-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {person.firstName} {person.lastName}
          </h3>
          <p className="text-sm text-gray-600 truncate">{person.headline}</p>
          {person.location && (
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <MapPin size={12} className="mr-1 flex-shrink-0" />
              {person.location}
            </p>
          )}
        </div>
      </div>
    
      {person.skills && person.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {person.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
              {skill}
            </span>
          ))}
        
          {person.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{person.skills.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );

  

  const renderPostCard = (post) => (
    <div key={post._id} className="bg-white border rounded-lg hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex items-start space-x-3 mb-3">
          {post.author?.profilePicture ? (
            <img src={post.author.profilePicture} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={16} className="text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {post.author?.firstName} {post.author?.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="text-gray-800 line-clamp-3">{post.content}</p>
        {post.image && (
          <img src={post.image} className="mt-2 rounded-lg w-full max-h-48 object-cover" />
        )}
      </div>
    </div>
  );

  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock size={18} className="mr-2 text-gray-600" />
            Recent
          </h3>
          <button
            onClick={clearAllRecentSearches}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors font-medium"
          >
            Clear all
          </button>
        </div>
        <div className="bg-white border rounded-lg divide-y">
          {recentSearches.slice(0, 5).map((search, index) => (
            <div
              key={`${search}-${index}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => setQuery(search)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Search size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{search}</p>
                  <p className="text-xs text-gray-500">Search</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecentSearch(index);
                }}
                className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          ))}
        </div>
        {recentSearches.length > 5 && (
          <button
            onClick={() => {
              // Could show more recent searches in a modal or expand the list
              console.log('Show all recent searches');
            }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Show all recent searches
          </button>
        )}
      </div>
    );
  };

  // Save search to recent searches
  useEffect(() => {
    if (query.trim() && debouncedQuery.trim()) {
      addRecentSearch(query);
    }
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Filters Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto p-4">
          {/* Search Type Tabs */}
          <div className="flex gap-6 border-b mb-4">
            {['all', 'people', 'posts'].map((searchType) => (
              <button
                key={searchType}
                type="button"
                onClick={() => setType(searchType)}
                className={`pb-3 px-1 capitalize border-b-2 transition-all font-medium ${
                  type === searchType
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {searchType === 'all' && 'All'}
                {searchType === 'people' && 'People'}
                {searchType === 'posts' && 'Posts'}
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 border rounded-lg p-4 space-y-4 mb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase size={16} className="inline mr-1" />
                    Experience
                  </label>
                  <input
                    type="text"
                    placeholder="Job title or role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={filters.experience}
                    onChange={(e) => setFilters({...filters, experience: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap size={16} className="inline mr-1" />
                    Education
                  </label>
                  <input
                    type="text"
                    placeholder="School or university"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={filters.education}
                    onChange={(e) => setFilters({...filters, education: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <input
                    type="text"
                    placeholder="React, Node.js, Design..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={filters.skills}
                    onChange={(e) => setFilters({...filters, skills: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter size={20} />
              Filters
              {(Object.values(filters).some(v => v)) && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(v => v).length}
                </span>
              )}
            </button>
            {query && (
              <div className="text-sm text-gray-600">
                Searching for: <span className="font-medium">"{query}"</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-4xl mx-auto p-4">
        {!query ? (
          <div className="space-y-6">
            {renderRecentSearches()}
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp size={18} className="mr-2" />
                Trending searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {['React Developer', 'Product Manager', 'UX Designer', 'Data Science', 'Remote Work', 'Machine Learning'].map((trending, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(trending)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
                  >
                    {trending}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-gray-600">
              {searchResults?.total || 0} results for "{query}"
            </div>
            
            {searchResults?.results?.people?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users size={20} className="mr-2" />
                  People ({searchResults.results.people.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.results.people.map(renderPersonCard)}
                </div>
              </div>
            )}
            
            {searchResults?.results?.posts?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText size={20} className="mr-2" />
                  Posts ({searchResults.results.posts.length})
                </h2>
                <div className="space-y-4">
                  {searchResults.results.posts.map(renderPostCard)}
                </div>
              </div>
            )}
            
            {searchResults?.results?.people?.length === 0 && 
             searchResults?.results?.posts?.length === 0 && (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No results found for "{query}"</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};